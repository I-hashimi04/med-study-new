import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Request
import traceback

class MedicalStudyLogger:
    """Enhanced logging for Medical Study Hub"""
    
    def __init__(self, name: str = "medical_study"):
        self.logger = logging.getLogger(name)
        self.setup_logging()
    
    def setup_logging(self):
        """Configure logging with structured format"""
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler for production
        try:
            file_handler = logging.FileHandler('/app/logs/medical_study.log')
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
        except (PermissionError, FileNotFoundError):
            # Skip file logging if not available
            pass
        
        self.logger.setLevel(logging.INFO)
    
    def log_api_request(self, request: Request, endpoint: str, user_id: Optional[str] = None):
        """Log API request details"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "api_request",
            "endpoint": endpoint,
            "method": request.method,
            "user_id": user_id,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else None
        }
        self.logger.info(f"API Request: {json.dumps(log_data)}")
    
    def log_question_generation(self, text_length: int, questions_generated: int, processing_time: float):
        """Log question generation metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "question_generation",
            "text_length": text_length,
            "questions_generated": questions_generated,
            "processing_time": processing_time,
            "questions_per_second": questions_generated / processing_time if processing_time > 0 else 0
        }
        self.logger.info(f"Question Generation: {json.dumps(log_data)}")
    
    def log_feedback_submission(self, question_id: str, rating: int, feedback_type: str):
        """Log feedback submission"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "feedback_submission",
            "question_id": question_id,
            "rating": rating,
            "feedback_type": feedback_type
        }
        self.logger.info(f"Feedback: {json.dumps(log_data)}")
    
    def log_error(self, error: Exception, context: Dict[str, Any]):
        """Log errors with context"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc(),
            "context": context
        }
        self.logger.error(f"Error: {json.dumps(log_data)}")
    
    def log_model_comparison(self, models: list, comparison_id: str, results: Dict[str, Any]):
        """Log model comparison results"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "model_comparison",
            "comparison_id": comparison_id,
            "models": models,
            "results_summary": {
                model: {
                    "avg_rating": results.get(model, {}).get("avg_rating"),
                    "processing_time": results.get(model, {}).get("processing_time")
                }
                for model in models
            }
        }
        self.logger.info(f"Model Comparison: {json.dumps(log_data)}")

# Global logger instance
app_logger = MedicalStudyLogger()

def log_request_middleware(request: Request, call_next):
    """Middleware to log all requests"""
    import time
    start_time = time.time()
    
    # Log request
    app_logger.log_api_request(request, str(request.url.path))
    
    # Process request
    response = call_next(request)
    
    # Log response time
    process_time = time.time() - start_time
    app_logger.logger.info(f"Request processed in {process_time:.2f}s")
    
    return response