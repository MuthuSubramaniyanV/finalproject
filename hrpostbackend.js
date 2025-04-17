import express from "express";
import cors from "cors";
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { Pool } = pkg;
 
// Add PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'INNOVATIVE_HIRING', // replace with your database name
  password: 'admin', // replace with your password
  port: 5432,
});
 
// First, add the unique constraint to the database
const addUniqueConstraint = `
  ALTER TABLE interviews
  ADD CONSTRAINT unique_interview_stage
  UNIQUE (candidate_id, post_id, interview_stage);
`;
 
//Express server configuration and Deepgram client setup
const app = express();
const port = 5010;

 
// Middleware setup
app.use(cors());
app.use(express.json());

// Add save-post endpoint
app.post("/save-post", async (req, res) => {
    try {
      const {
        title,
        description,
        minimum_experience,
        category,
        exam_type,
        followup,
        coverage,
        time,
        application_deadline,
        test_start_date
      } = req.body;
  
      const query = `
        INSERT INTO post (
          title, description, minimum_experience, category,
          exam_type, followup, coverage, time,
          application_deadline, test_start_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING post_id`;
  
      const values = [
        title,
        description,
        minimum_experience,
        category,
        exam_type,
        exam_type === 'MCQ' ? null : followup,
        exam_type === 'MCQ' ? null : coverage,
        time,
        application_deadline,
        test_start_date
      ];
  
      const result = await pool.query(query, values);
      res.status(201).json({
        message: 'Post created successfully',
        post_id: result.rows[0].post_id
      });
  
    } catch (error) {
      console.error('Error saving post:', error);
      res.status(500).json({
        error: 'Failed to save post',
        details: error.message
      });
    }
  });

// Update the update-panel endpoint
app.put("/update-panel", async (req, res) => {
    try {
      const { post_id, panels, exam_type } = req.body;
  
      // Validate panels based on exam type
      if (!Array.isArray(panels)) {
        return res.status(400).json({ 
          error: 'Invalid panel data. Panels must be an array.' 
        });
      }
  
      // Now require 3 panel members for both MCQ and Interview
      if (panels.length !== 3) {
        return res.status(400).json({ 
          error: 'Both MCQ and Interview posts require exactly 3 panel members (Beginner, Intermediate, Advanced).' 
        });
      }
  
      // Join panels with comma to store in database
      const panelString = panels.join(',');
  
      const query = `
        UPDATE post 
        SET panel_id = $1,
            status = 'active'
        WHERE post_id = $2
        RETURNING *`;
  
      const result = await pool.query(query, [panelString, post_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      res.status(200).json({
        message: 'Panel members assigned successfully for all levels',
        post: result.rows[0]
      });
  
    } catch (error) {
      console.error('Error updating panels:', error);
      res.status(500).json({
        error: 'Failed to update panels',
        details: error.message
      });
    }
  });

  // Add delete-post endpoint
app.delete("/delete-post/:id", async (req, res) => {
    try {
      const postId = req.params.id;
  
      // Delete the post from the database
      const query = 'DELETE FROM post WHERE post_id = $1 RETURNING *';
      const result = await pool.query(query, [postId]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
      res.status(200).json({
        message: 'Post deleted successfully',
        deletedPost: result.rows[0]
      });
  
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        error: 'Failed to delete post',
        details: error.message
      });
    }
  });

  //To update post
  app.put("/update-post/:id", async (req, res) => {
    try {
      const postId = req.params.id;
      const {
        title,
        description,
        minimum_experience,
        category,
        exam_type,
        followup,
        coverage,
        time,
        application_deadline,
        test_start_date
      } = req.body;
  
      const query = `
        UPDATE post 
        SET title = $1,
            description = $2,
            minimum_experience = $3,
            category = $4,
            exam_type = $5,
            followup = $6,
            coverage = $7,
            time = $8,
            application_deadline = $9,
            test_start_date = $10
        WHERE post_id = $11
        RETURNING *`;
  
      const values = [
        title,
        description,
        minimum_experience,
        category,
        exam_type,
        followup,
        coverage,
        time,
        application_deadline,
        test_start_date,
        postId
      ];
  
      const result = await pool.query(query, values);
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
      res.status(200).json({
        message: 'Post updated successfully',
        post: result.rows[0]
      });
  
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({
        error: 'Failed to update post',
        details: error.message
      });
    }
  });

  // Add endpoint to get all post
app.get("/post", async (req, res) => {
    try {
      const query = 'SELECT * FROM post ORDER BY created_at DESC';
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({
        error: 'Failed to fetch post',
        details: error.message
      });
    }
  });

// Add endpoint to fetch panel members
app.get("/panel-members", async (req, res) => {
    try {
      const query = `
        SELECT id, username 
        FROM users 
        WHERE user_role = 'Panel'
        ORDER BY username`;
      
      const result = await pool.query(query);
      
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching panel members:', error);
      res.status(500).json({
        error: 'Failed to fetch panel members',
        details: error.message
      });
    }
  });

// Add endpoint to check report status
app.get('/check-report-status/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM interviews i
          WHERE i.post_id = $1 
          AND i.report_to_hr = 'yes'
        ) as has_reported,
        EXISTS (
          SELECT 1 FROM interviews i
          WHERE i.post_id = $1 
          AND i.selected = 'yes'
        ) as has_reportable
      `;
      
      const result = await pool.query(query, [postId]);
      res.json({
        hasReported: result.rows[0]?.has_reported || false,
        hasReportable: result.rows[0]?.has_reportable || false
      });
    } catch (error) {
      console.error('Error checking report status:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });