from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime
import random
import string
from datetime import datetime, timedelta
from datetime import date
import json

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="INNOVATIVE_HIRING",
            user="postgres",
            password="admin",
            host="localhost",
            port="5432"
        )
        return conn
    except psycopg2.Error as e:
        print("Error connecting to PostgreSQL:", e)
        return None

# Global variable for email storage
received_email = None
active_otps = {}  # Store OTPs with expiration times

# Helper functions
def generate_otp(length=6):
    """Generate a random OTP of specified length."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp):
    """Send OTP via email."""
    try:
        email_sender = 'innovativehiring032@gmail.com'
        email_password = os.getenv('EMAIL_PASSWORD', 'gyyj zcta jsxs fmdt')
        
        msg = EmailMessage()
        msg.set_content(f"""
        Dear User,

        Your OTP for password reset is: {otp}

        This OTP will expire in 15 minutes.

        If you did not request this, please ignore this email.

        Best regards,
        Innovative Hiring Team
        """)
        
        msg["Subject"] = "Password Reset OTP"
        msg["From"] = email_sender
        msg["To"] = email

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(email_sender, email_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

@app.route('/jobs', methods=['GET'])
def get_jobs():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT post_id, title, description, minimum_experience, exam_type, application_deadline
            FROM post
            WHERE status = 'active' AND (application_deadline IS NULL OR application_deadline >= %s)
        """, (date.today(),))

        jobs = [
            {
                "job_id": row[0],
                "job_title": row[1],
                "description": row[2],
                "minimum_experience": row[3],
                "exam_type": row[4],
                "application_deadline": row[5].strftime('%Y-%m-%d') if row[5] else None
            }
            for row in cur.fetchall()
        ]

        return jsonify(jobs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()



@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username_or_email = data.get("username")
    password = data.get("password")

    if not username_or_email or not password:
        return jsonify({"message": "Username or email and password are required", "status": "error"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed", "status": "error"}), 500

    try:
        cursor = conn.cursor()
        query = """
            SELECT id, username, email, user_password, user_role, user_status 
            FROM users 
            WHERE (username = %s OR email = %s)
        """
        cursor.execute(query, (username_or_email, username_or_email))
        user = cursor.fetchone()

        if user and user[5] == 'Deactivated':  # Check if account is deactivated
            return jsonify({"message": "Account is deactivated", "status": "error"}), 401

        if user and user[3] == password:  # Verify password
            # Restrict login only to panel members
           

            # Get assigned candidates count
            cursor.execute("""
                SELECT COUNT(*) 
                FROM candidate 
                WHERE assigned_panel = %s
            """, (user[0],))
            assigned_count = cursor.fetchone()[0]

            return jsonify({
                "message": "Login successful",
                "user": {
                    "user_id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "role": user[4],
                    "assigned_candidates_count": assigned_count
                },
                "status": "success"
            }), 200
        else:
            return jsonify({"message": "Invalid credentials", "status": "error"}), 401

    except Exception as e:
        return jsonify({"message": str(e), "status": "error"}), 500
    finally:
        cursor.close()
        conn.close()

        
# Email registration routes
@app.route('/api/send-email', methods=['OPTIONS', 'POST'])
def receive_email():
    global received_email
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight OK"}), 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data received"}), 400

        email1 = data.get("email")
        if not email1:
            return jsonify({"success": False, "message": "Email is required"}), 400

        received_email = email1
        return jsonify({"success": True, "message": "Email send successfully"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    global received_email
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required", "status": "error"}), 400

    if not received_email:
        return jsonify({"message": "No email found. Please send email first.", "status": "error"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed", "status": "error"}), 500

    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE email = %s", (received_email,))
    user_data = cursor.fetchone()

    if not user_data:
        cursor.close()
        conn.close()
        return jsonify({"message": "Email not found", "status": "error"}), 400

    email = received_email

    update_query = """
        UPDATE users 
        SET username = %s, user_password = %s, is_registered = TRUE, user_status = 'Activated'
        WHERE email = %s
        RETURNING id, username, user_role
    """
    cursor.execute(update_query, (username, password, email))
    new_user = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "user_id": new_user[0],
            "username": new_user[1],
            "role": new_user[2]
        },
        "status": "success"
    }), 201

@app.route('/api/create-user', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data received"}), 400

        email = data.get("email")
        role = data.get("role")

        if not email or not role:
            return jsonify({"success": False, "message": "Email and role are required!"}), 400

        if role not in ["Admin", "Hr", "Panel"]:
            return jsonify({"success": False, "message": "Invalid role!"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"success": False, "message": "Unable to establish database connection"}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Email already registered!"}), 400

        cursor.execute(
            """
            INSERT INTO users 
            (email, user_role, user_status, is_registered, created_at)
            VALUES (%s, %s::roles, 'Deactivated'::status, FALSE, %s)
            RETURNING id
            """,
            (email, role, datetime.now())
        )
        user_id = cursor.fetchone()
        if not user_id:
            raise Exception("Failed to create user record")

        conn.commit()

        # Sending email
        register_link = f"http://localhost:5173/register?email={email}"
        email_sender = 'innovativehiring032@gmail.com'
        email_password = os.getenv('EMAIL_PASSWORD', 'gyyj zcta jsxs fmdt')
        email_receiver = email

        msg = EmailMessage()
        msg.set_content(f"""
        Welcome to our platform!
        
        Click the following link to complete your registration: {register_link}
        
        This link will allow you to set up your username and password.
        """)
        msg["Subject"] = "Complete Your Registration"
        msg["From"] = email_sender
        msg["To"] = email_receiver

        # Send the email
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(email_sender, email_password)
            server.send_message(msg)

        return jsonify({
            "success": True,
            "message": "User created successfully and registration email sent",
            "user_id": user_id[0]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error creating user: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Failed to create user: {str(e)}"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/get-users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email, user_role, user_status 
            FROM users
        """)
        
        users = [
            {
                "id": row[0],
                "name": row[1] or "Not Set",
                "email": row[2],
                "role": row[3],
                "status": row[4]
            }
            for row in cursor.fetchall()
        ]

        return jsonify(users)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@app.route('/api/send-otp', methods=['OPTIONS', 'POST'])
def send_otp():
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight OK"}), 200
        
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Email not found'}), 404
        
        # Generate OTP
        otp = generate_otp()
        expiration_time = datetime.now() + timedelta(minutes=15)
        active_otps[email] = {
            'otp': otp,
            'expires_at': expiration_time
        }
        
        
        
        # Send OTP via email
        if send_otp_email(email, otp):
            return jsonify({'success': True, 'message': 'OTP sent successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send OTP'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({'success': False, 'message': 'Email and OTP are required'}), 400
    
    if email not in active_otps:
        return jsonify({'success': False, 'message': 'No active OTP found for this email'}), 404
    
    otp_data = active_otps[email]
    
    if datetime.now() > otp_data['expires_at']:
        del active_otps[email]
        return jsonify({'success': False, 'message': 'OTP has expired'}), 400
    
    if otp != otp_data['otp']:
        return jsonify({'success': False, 'message': 'Invalid OTP'}), 400
    
    return jsonify({'success': True, 'message': 'OTP verified successfully'})

    
@app.route('/api/reset-credentials', methods=['POST'])
def reset_credentials():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_username = data.get('newUsername')
    new_password = data.get('newPassword')
    
    if not all([email, otp, new_username, new_password]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if email not in active_otps or otp != active_otps[email]['otp']:
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400
    
    if datetime.now() > active_otps[email]['expires_at']:
        del active_otps[email]
        return jsonify({'success': False, 'message': 'OTP has expired'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor()
        
        # Check if new username conflicts with existing users
        cursor.execute(
            "SELECT id FROM users WHERE username = %s AND email != %s",
            (new_username, email)
        )
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username already taken'}), 400
        
        # Update user credentials
        cursor.execute(
            """
            UPDATE users 
            SET username = %s, user_password = %s, is_registered = TRUE, 
                user_status = 'Activated'
            WHERE email = %s
            RETURNING id
            """,
            (new_username, new_password, email)
        )
        
        if cursor.fetchone():
            conn.commit()
            del active_otps[email]  # Clean up used OTP
            return jsonify({'success': True, 'message': 'Credentials updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

  
@app.route('/api/panel/tasks/<username>', methods=['GET'])
def get_panel_tasks(username):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            WITH panel_tasks AS (
                SELECT 
                    p.post_id,
                    p.title,
                    p.description,
                    p.category,
                    p.exam_type,
                    p.time,
                    p.test_start_date,
                    p.panel_id,
                    p.status,
                    p.coverage,
                    p.followup,
                    array_position(string_to_array(p.panel_id, ','), %s) as panel_position,
                    CASE 
                        WHEN array_position(string_to_array(p.panel_id, ','), %s) = 1 THEN 'Beginner'::candidate_level
                        WHEN array_position(string_to_array(p.panel_id, ','), %s) = 2 THEN 'Intermediate'::candidate_level
                        WHEN array_position(string_to_array(p.panel_id, ','), %s) = 3 THEN 'Advanced'::candidate_level
                    END as expected_level
                FROM post p 
                WHERE p.panel_id LIKE %s
                AND (p.status = 'active' OR p.status = 'pending')
            ),
            task_candidates AS (
                SELECT 
                    t.post_id,
                    json_agg(
                        json_build_object(
                            'candidate_id', c.candidate_id,
                            'name', c.name,
                            'email', c.email,
                            'candidate_level', c.candidate_level,
                            'progress', c.progress,
                            'selected', c.selected
                        )
                    ) FILTER (WHERE c.candidate_id IS NOT NULL) as candidates
                FROM panel_tasks t
                LEFT JOIN candidate c ON c.job_id = t.post_id 
                    AND c.candidate_level = t.expected_level
                GROUP BY t.post_id
            )
            SELECT 
                t.*,
                COALESCE(tc.candidates, '[]') as candidates
            FROM panel_tasks t
            LEFT JOIN task_candidates tc ON t.post_id = tc.post_id
            ORDER BY t.panel_position;
        """, (username, username, username, username, f'%{username}%'))

        tasks = []
        for row in cursor.fetchall():
            task = {
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'category': row[3],
                'type': row[4],
                'time': row[5],
                'test_start_date': row[6].strftime('%Y-%m-%d') if row[6] else None,
                'panel_id': row[7],
                'status': row[8] or 'Pending',
                'coverage': row[9],
                'followup': row[10],
                'panel_position': row[11],
                'expected_level': row[12],
                'candidates': row[13],
                'levelIndicator': (
                    'Beginner Level' if row[11] == 1 else
                    'Intermediate Level' if row[11] == 2 else
                    'Advanced Level' if row[11] == 3 else ''
                )
            }
            tasks.append(task)

        return jsonify({
            "status": "success",
            "tasks": tasks
        }), 200

    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"Failed to fetch tasks: {str(e)}"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/panel/notify-hr', methods=['POST'])
def notify_hr():
    try:
        data = request.json
        question_id = data.get('questionId')
        
        if not question_id:
            return jsonify({
                "status": "error",
                "message": "Question ID is required"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update notify status to true
        cursor.execute("""
            UPDATE question 
            SET notify = true 
            WHERE question_id = %s 
            RETURNING question_id, question_title, notify
        """, (question_id,))
        
        updated = cursor.fetchone()
        conn.commit()

        if updated:
            return jsonify({
                "status": "success",
                "message": "HR has been notified",
                "question": {
                    "id": updated[0],
                    "title": updated[1],
                    "notify": updated[2]
                }
            }), 200
        
        return jsonify({
            "status": "error",
            "message": "Question not found"
        }), 404

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/panel/delete-question/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # First check if question exists and if it's notified
        cursor.execute("""
            SELECT notify 
            FROM question 
            WHERE question_id = %s
        """, (question_id,))
        
        question = cursor.fetchone()
        
        if not question:
            return jsonify({
                "status": "error",
                "message": "Question not found"
            }), 404
            
        if question[0]:  # if notify is True
            return jsonify({
                "status": "error",
                "message": "Cannot delete question that has been notified to HR"
            }), 403

        # Delete the question
        cursor.execute("""
            DELETE FROM question 
            WHERE question_id = %s 
            AND notify = false
        """, (question_id,))
        
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Question deleted successfully"
        }), 200

    except Exception as e:
        print(f"Error deleting question: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/questions/<question_type>', methods=['GET'])
def get_questions_by_type(question_type):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        username = request.args.get('username')
        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required"
            }), 400

        valid_types = ['MCQ', 'Interview', 'ALL']
        normalized_type = question_type.upper() if question_type.lower() == 'all' or question_type.upper() == 'MCQ' else question_type.capitalize()

        if normalized_type not in valid_types:
            return jsonify({
                "status": "error",
                "message": "Invalid question type"
            }), 400

        if normalized_type == 'ALL':
            query = """
                SELECT question_id, question_title, questions, exam_type, notify, created_by
                FROM question
                WHERE created_by = %s
                ORDER BY question_id DESC
            """
            cursor.execute(query, (username,))
        else:
            query = """
                SELECT question_id, question_title, questions, exam_type, notify, created_by
                FROM question
                WHERE exam_type = %s::exam_type AND created_by = %s
                ORDER BY question_id DESC
            """
            cursor.execute(query, (normalized_type, username))

        questions = [{
            'question_id': row[0],
            'question_title': row[1],
            'questions': row[2],
            'exam_type': row[3],
            'notify': row[4],
            'created_by': row[5]
        } for row in cursor.fetchall()]

        return jsonify({
            "status": "success",
            "questions": questions
        }), 200

    except Exception as e:
        print(f"Error fetching questions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/questions', methods=['GET', 'OPTIONS'])
def get_questions():
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get questions created by the specified user
        cursor.execute("""
            SELECT 
                question_id, 
                question_title, 
                questions, 
                exam_type, 
                notify,
                created_by
            FROM question
            WHERE created_by = %s
            ORDER BY question_id DESC
        """, (username,))
        
        questions = [{
            'question_id': row[0],
            'question_title': row[1],
            'questions': row[2],
            'exam_type': row[3],
            'notify': row[4],
            'created_by': row[5]
        } for row in cursor.fetchall()]

        return jsonify({
            "status": "success",
            "questions": questions
        }), 200

    except Exception as e:
        print(f"Error fetching questions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/hiring-questions', methods=['GET'])
def get_hiring_questions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                q.question_id,
                q.question_title,
                q.questions,
                q.exam_type,
                q.notify,
                q.job_id,
                p.title as job_title,
                p.test_start_date,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'candidate_id', c.candidate_id,
                            'name', c.name,
                            'email', c.email,
                            'level', c.candidate_level,
                            'progress', c.progress
                        )
                    ) FILTER (WHERE c.candidate_id IS NOT NULL),
                    '[]'
                ) as candidates
            FROM question q
            LEFT JOIN post p ON q.job_id = p.post_id
            LEFT JOIN candidate c ON p.post_id = c.job_id
            GROUP BY 
                q.question_id, 
                q.question_title,
                q.questions,
                q.exam_type,
                q.notify,
                q.job_id,
                p.title,
                p.test_start_date
            ORDER BY q.question_id DESC
        """)

        questions = []
        for row in cursor.fetchall():
            questions.append({
                "question_id": row[0],
                "question_title": row[1],
                "questions": row[2],
                "exam_type": row[3],
                "notify": row[4],
                "job_id": row[5],
                "job_title": row[6],
                "test_start_date": row[7].strftime('%Y-%m-%d') if row[7] else None,
                "candidates": row[8]
            })

        return jsonify({
            "status": "success",
            "questions": questions
        }), 200

    except Exception as e:
        print(f"Error fetching questions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/panel/save-questions', methods=['POST'])
def save_panel_questions():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['question_title', 'questions', 'exam_type', 'created_by', 'task_id']
        if not all(field in data for field in required_fields):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: question_title, questions, exam_type, created_by, or task_id"
            }), 400

        # Validate questions format
        questions = data['questions']
        if not isinstance(questions, list):
            return jsonify({
                "status": "error",
                "message": "Questions must be a list"
            }), 400

        # Validate each question
        for q in questions:
            if not isinstance(q, dict):
                return jsonify({
                    "status": "error",
                    "message": "Each question must be an object"
                }), 400
            
            if 'question' not in q or 'expected_answer' not in q:
                return jsonify({
                    "status": "error",
                    "message": "Each question must have 'question' and 'expected_answer' fields"
                }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert question with job_id
        cursor.execute("""
            INSERT INTO question 
            (question_title, questions, exam_type, notify, created_by, job_id) 
            VALUES (%s, %s, %s::exam_type, false, %s, %s)
            RETURNING question_id
        """, (
            data['question_title'],
            json.dumps(questions),
            data['exam_type'],
            data['created_by'],
            data['task_id']
        ))

        question_id = cursor.fetchone()[0]
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Questions saved successfully",
            "question_id": question_id
        }), 201

    except Exception as e:
        print(f"Error saving questions: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/save-selected-questions', methods=['POST'])
def save_selected_questions():
    try:
        data = request.json
        file_name = data.get('file_name')
        questions = data.get('questions')
        created_by = data.get('created_by')  # Add this line

        if not all([file_name, questions, created_by]):  # Update validation
            return jsonify({
                "status": "error",
                "message": "Missing required fields (file_name, questions, or created_by)"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update query to include created_by
        cursor.execute("""
            INSERT INTO question 
            (question_title, questions, exam_type, notify, created_by) 
            VALUES (%s, %s, 'MCQ', false, %s)
            RETURNING question_id, created_by
        """, (file_name, json.dumps(questions), created_by))
        
        result = cursor.fetchone()
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Questions saved successfully",
            "question_id": result[0],
            "created_by": result[1]
        }), 201

    except Exception as e:
        print(f"Error saving selected questions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/hr/start-test', methods=['POST', 'OPTIONS'])
def start_test():
    if request.method == 'OPTIONS':
        return {
            'Allow': 'POST, OPTIONS',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }, 200

    try:
        data = request.get_json()
        question_id = data.get('questionId')
        candidates = data.get('candidates')

        if not question_id or not candidates:
            return jsonify({
                "status": "error",
                "message": "Question ID and candidates are required"
            }), 400

        # Send emails to candidates
        email_sender = 'innovativehiring032@gmail.com'
        email_password = os.getenv('EMAIL_PASSWORD', 'gyyj zcta jsxs fmdt')
        emails_sent = 0

        for candidate in candidates:
            try:
                # Create email message
                msg = EmailMessage()
                msg.set_content(f"""
                Dear {candidate['name']},
                
                Congratulations.You have been selected for the test. Please click the link below to start your test:
                
                Test Link: http://localhost:5173/test

                Best regards,
                Innovative Hiring Team
                """)

                msg["Subject"] = "Test Invitation"
                msg["From"] = email_sender
                msg["To"] = candidate['email']

                # Send email
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
                    server.login(email_sender, email_password)
                    server.send_message(msg)
                
                emails_sent += 1
                print(f"Email sent to {candidate['email']}")

            except Exception as e:
                print(f"Error sending email to {candidate['email']}: {str(e)}")
                continue

        if emails_sent > 0:
            return jsonify({
                "status": "success",
                "message": f"Test invitation sent to {emails_sent} candidates"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to send emails to any candidates"
            }), 500

    except Exception as e:
        print(f"Error in start_test: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)