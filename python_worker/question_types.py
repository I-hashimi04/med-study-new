from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum

class QuestionType(str, Enum):
    """Enumeration of supported question types"""
    MCQ = "mcq"
    OPEN = "open"
    MATCHING = "matching"  # New
    ORDERING = "ordering"  # New
    IMAGE_BASED = "image_based"  # New
    FREE_TEXT = "free_text"  # New
    CLINICAL_SCENARIO = "clinical_scenario"  # New

class BaseQuestion(BaseModel):
    """Base model for all question types"""
    type: QuestionType
    question: str
    difficulty: str
    tags: List[str]
    reference: Optional[str] = None
    hint: Optional[str] = None

class MCQQuestion(BaseQuestion):
    """Multiple Choice Question"""
    type: QuestionType = QuestionType.MCQ
    stem: str
    options: List[str]
    answer: str
    explanation: str

class OpenQuestion(BaseQuestion):
    """Open-ended Question"""
    type: QuestionType = QuestionType.OPEN
    answer: str

class MatchingQuestion(BaseQuestion):
    """Matching Question - match items from two lists"""
    type: QuestionType = QuestionType.MATCHING
    left_items: List[str]
    right_items: List[str]
    correct_matches: Dict[str, str]  # left_item -> right_item

class OrderingQuestion(BaseQuestion):
    """Ordering Question - arrange items in correct order"""
    type: QuestionType = QuestionType.ORDERING
    items: List[str]
    correct_order: List[int]  # indices of items in correct order

class ImageBasedQuestion(BaseQuestion):
    """Image-based Question - requires image analysis"""
    type: QuestionType = QuestionType.IMAGE_BASED
    image_url: str
    image_description: str
    answer: str

class FreeTextQuestion(BaseQuestion):
    """Free Text Question - essay-style response"""
    type: QuestionType = QuestionType.FREE_TEXT
    word_limit: Optional[int] = None
    sample_answer: str

class ClinicalScenarioQuestion(BaseQuestion):
    """Clinical Scenario Question - case-based"""
    type: QuestionType = QuestionType.CLINICAL_SCENARIO
    patient_info: Dict[str, Any]
    scenario: str
    sub_questions: List[Dict[str, str]]
    diagnosis: Optional[str] = None

class QuestionGenerator(ABC):
    """Abstract base class for question generators"""
    
    @abstractmethod
    def generate_questions(self, content: str, count: int = 5) -> List[BaseQuestion]:
        """Generate questions from content"""
        pass
    
    @abstractmethod
    def get_supported_types(self) -> List[QuestionType]:
        """Return list of supported question types"""
        pass

class BasicQuestionGenerator(QuestionGenerator):
    """Basic implementation supporting MCQ and Open questions"""
    
    def get_supported_types(self) -> List[QuestionType]:
        return [QuestionType.MCQ, QuestionType.OPEN]
    
    def generate_questions(self, content: str, count: int = 5) -> List[BaseQuestion]:
        """Generate basic questions (placeholder implementation)"""
        questions = []
        
        # Generate a mix of MCQ and open questions
        for i in range(count):
            if i % 2 == 0:
                question = MCQQuestion(
                    question=f"Sample MCQ question {i+1} based on content",
                    stem=f"Which of the following best describes concept {i+1}?",
                    options=[f"Option A for Q{i+1}", f"Option B for Q{i+1}", f"Option C for Q{i+1}", f"Option D for Q{i+1}"],
                    answer=f"Option A for Q{i+1}",
                    explanation=f"Option A is correct because it accurately describes concept {i+1}",
                    difficulty="moderate",
                    tags=["general", "concept"],
                    reference=f"section {i+1}"
                )
            else:
                question = OpenQuestion(
                    question=f"Explain the significance of concept {i+1} discussed in the content.",
                    answer=f"Concept {i+1} is significant because it demonstrates key principles...",
                    difficulty="moderate",
                    tags=["explanation", "concept"],
                    reference=f"section {i+1}"
                )
            questions.append(question)
        
        return questions

class AdvancedQuestionGenerator(QuestionGenerator):
    """Advanced implementation supporting all question types"""
    
    def get_supported_types(self) -> List[QuestionType]:
        return list(QuestionType)
    
    def generate_questions(self, content: str, count: int = 5) -> List[BaseQuestion]:
        """Generate advanced questions (placeholder implementation)"""
        questions = []
        
        # Example implementations for new question types
        
        # Matching question
        matching_q = MatchingQuestion(
            question="Match the medical terms with their definitions",
            left_items=["Hypertension", "Diabetes", "Asthma"],
            right_items=["High blood pressure", "High blood sugar", "Airway inflammation"],
            correct_matches={
                "Hypertension": "High blood pressure",
                "Diabetes": "High blood sugar", 
                "Asthma": "Airway inflammation"
            },
            difficulty="easy",
            tags=["terminology", "definitions"],
            reference="terminology section"
        )
        questions.append(matching_q)
        
        # Ordering question
        ordering_q = OrderingQuestion(
            question="Arrange the steps of patient assessment in correct order",
            items=["Treatment", "Diagnosis", "Assessment", "Follow-up"],
            correct_order=[2, 1, 0, 3],  # Assessment, Diagnosis, Treatment, Follow-up
            difficulty="moderate",
            tags=["procedure", "clinical"],
            reference="clinical procedure section"
        )
        questions.append(ordering_q)
        
        # Clinical scenario
        clinical_q = ClinicalScenarioQuestion(
            question="Analyze this clinical case and answer the following questions",
            patient_info={
                "age": 45,
                "gender": "male",
                "chief_complaint": "chest pain"
            },
            scenario="A 45-year-old male presents with acute chest pain...",
            sub_questions=[
                {"question": "What is the most likely diagnosis?", "answer": "Myocardial infarction"},
                {"question": "What immediate tests would you order?", "answer": "ECG, cardiac enzymes, chest X-ray"}
            ],
            diagnosis="Acute myocardial infarction",
            difficulty="difficult",
            tags=["cardiology", "diagnosis", "emergency"],
            reference="cardiology case studies"
        )
        questions.append(clinical_q)
        
        return questions

# Factory for creating question generators
class QuestionGeneratorFactory:
    """Factory for creating appropriate question generators"""
    
    @staticmethod
    def create_generator(generator_type: str = "basic") -> QuestionGenerator:
        """Create a question generator of the specified type"""
        if generator_type == "advanced":
            return AdvancedQuestionGenerator()
        else:
            return BasicQuestionGenerator()
    
    @staticmethod
    def get_available_types() -> List[str]:
        """Get list of available generator types"""
        return ["basic", "advanced"]