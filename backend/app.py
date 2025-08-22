# Smart Office Seat Planner API
# Run with: uvicorn app:app --host 0.0.0.0 --port 8000

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib

# Optional imports with fallbacks
try:
    from scipy.optimize import linear_sum_assignment
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

# Initialize FastAPI app
app = FastAPI(
    title="Smart Office Seat Planner API",
    description="Rule-driven backend for seat assignment and weekly scheduling",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model loading (optional)
MODEL_DIR = os.getenv("MODEL_DIR", "models")
MODELS = {}

def load_models():
    """Load ML models if available"""
    model_files = {
        "onsite": os.getenv("MODEL_ONSITE", f"{MODEL_DIR}/onsite_model.joblib"),
        "seat": os.getenv("MODEL_SEAT", f"{MODEL_DIR}/seat_model.joblib"),
        "project": os.getenv("MODEL_PROJ", f"{MODEL_DIR}/project_model.joblib")
    }
    
    for name, path in model_files.items():
        try:
            if os.path.exists(path):
                MODELS[name] = joblib.load(path)
                print(f"Loaded {name} model from {path}")
        except Exception as e:
            print(f"Failed to load {name} model: {e}")

# Load models on startup
load_models()

# Pydantic Models
class Employee(BaseModel):
    employee_id: str
    full_name: Optional[str] = None
    department: Optional[str] = None
    team: Optional[str] = None
    priority_level: Optional[float] = 1.0
    preferred_work_mode: Optional[str] = "hybrid"  # onsite | hybrid | remote
    needs_accessible: Optional[bool] = False
    prefer_window: Optional[bool] = False
    preferred_zone: Optional[str] = None
    preferred_days: Optional[List[str]] = []
    client_site_ratio: Optional[float] = 0.0
    commute_minutes: Optional[float] = 30.0
    availability_ratio: Optional[float] = 1.0
    onsite_ratio: Optional[float] = 0.5
    project_count: Optional[float] = 1.0
    extra: Optional[Dict[str, Any]] = {}

class Seat(BaseModel):
    seat_id: str
    floor: Optional[int] = 1
    zone: Optional[str] = "ZoneA"
    is_accessible: Optional[bool] = False
    is_window: Optional[bool] = False
    x: Optional[int] = 0
    y: Optional[int] = 0

class AssignmentRequest(BaseModel):
    employees: List[Employee]
    seats: List[Seat]
    weights: Optional[Dict[str, float]] = {}
    max_assignments: Optional[int] = None
    solver: Optional[str] = "greedy"

class AssignmentResult(BaseModel):
    employee_id: str
    seat_id: str
    score: float
    reasons: Dict[str, float]

class AssignmentResponse(BaseModel):
    assignments: List[AssignmentResult]
    unassigned_employees: List[str]
    unused_seats: List[str]
    meta: Dict[str, Any]

class ScheduleRequest(BaseModel):
    employees: List[Employee]
    seats: List[Seat]
    capacity_by_day: Dict[str, int]
    dept_day_cap_pct: Optional[float] = 0.60
    together_teams: Optional[List[List[str]]] = []
    team_together_mode: Optional[str] = "soft"  # soft | hard
    weights: Optional[Dict[str, float]] = {}
    solver: Optional[str] = "hungarian"
    days: Optional[List[str]] = ["Mon", "Tue", "Wed", "Thu", "Fri"]

class ScheduleResponse(BaseModel):
    days: List[str]
    attendance: Dict[str, List[str]]
    assignments: Dict[str, List[AssignmentResult]]
    violations: List[str]
    meta: Dict[str, Any]

class PredictRequest(BaseModel):
    record: Dict[str, Any]

# Default weights
DEFAULT_WEIGHTS = {
    "w_seat_satisfaction": 3.0,
    "w_onsite_ratio": 2.0,
    "w_project_penalty": -0.05,
    "w_window": 1.0,
    "w_accessible": 1.5,
    "w_zone": 0.5,
    "w_zone_cohesion": 0.75
}

def get_weights(custom_weights: Dict[str, float]) -> Dict[str, float]:
    """Merge custom weights with defaults"""
    weights = DEFAULT_WEIGHTS.copy()
    weights.update(custom_weights)
    return weights

def calculate_score(employee: Employee, seat: Seat, weights: Dict[str, float], team_zone_bonus: float = 0.0) -> tuple[float, Dict[str, float]]:
    """Calculate assignment score with detailed reasons"""
    reasons = {}
    total_score = 0.0
    
    # ML-based scoring if models are available
    if "seat" in MODELS:
        try:
            # Prepare features for seat satisfaction model
            features = [
                employee.onsite_ratio or 0.5,
                employee.project_count or 1.0,
                1.0 if seat.is_window else 0.0,
                1.0 if seat.is_accessible else 0.0,
                seat.floor or 1,
            ]
            satisfaction_prob = MODELS["seat"].predict_proba([features])[0][1]
            score_component = satisfaction_prob * weights["w_seat_satisfaction"]
            total_score += score_component
            reasons["ml_seat_satisfaction"] = score_component
        except Exception as e:
            print(f"ML seat scoring failed: {e}")
    
    if "onsite" in MODELS:
        try:
            # Prepare features for onsite ratio prediction
            features = [
                employee.commute_minutes or 30.0,
                employee.availability_ratio or 1.0,
                len(employee.preferred_days or []),
            ]
            onsite_pred = MODELS["onsite"].predict([features])[0]
            score_component = onsite_pred * weights["w_onsite_ratio"]
            total_score += score_component
            reasons["ml_onsite_ratio"] = score_component
        except Exception as e:
            print(f"ML onsite scoring failed: {e}")
    
    # Project count penalty
    project_penalty = (employee.project_count or 1.0) * weights["w_project_penalty"]
    total_score += project_penalty
    reasons["project_penalty"] = project_penalty
    
    # Heuristic scoring
    # Window preference
    if employee.prefer_window and seat.is_window:
        window_bonus = weights["w_window"]
        total_score += window_bonus
        reasons["window_match"] = window_bonus
    
    # Accessibility preference
    if employee.needs_accessible and seat.is_accessible:
        accessible_bonus = weights["w_accessible"]
        total_score += accessible_bonus
        reasons["accessibility_match"] = accessible_bonus
    
    # Zone preference
    if employee.preferred_zone and employee.preferred_zone == seat.zone:
        zone_bonus = weights["w_zone"]
        total_score += zone_bonus
        reasons["zone_match"] = zone_bonus
    
    # Team zone cohesion bonus
    if team_zone_bonus > 0:
        total_score += team_zone_bonus
        reasons["team_cohesion"] = team_zone_bonus
    
    return total_score, reasons

def check_hard_constraints(employee: Employee, seat: Seat) -> bool:
    """Check if assignment violates hard constraints"""
    # Accessibility constraint
    if employee.needs_accessible and not seat.is_accessible:
        return False
    return True

def select_daily_attendance(employees: List[Employee], day: str, capacity: int, dept_cap_pct: float) -> tuple[List[Employee], List[str]]:
    """Select employees for a given day respecting capacity and department limits"""
    violations = []
    
    # Calculate attendance score for each employee
    employee_scores = []
    for emp in employees:
        preferred_day_bonus = 1.0 if day in (emp.preferred_days or []) else 0.6
        score = (emp.onsite_ratio or 0.5) * preferred_day_bonus * (1 - (emp.client_site_ratio or 0.0))
        employee_scores.append((emp, score))
    
    # Sort by score descending
    employee_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Select employees respecting capacity and department limits
    selected = []
    dept_counts = {}
    
    for emp, score in employee_scores:
        if len(selected) >= capacity:
            break
            
        dept = emp.department or "Unknown"
        dept_limit = int(capacity * dept_cap_pct)
        
        if dept_counts.get(dept, 0) >= dept_limit:
            violations.append(f"Department {dept} exceeded daily limit on {day}")
            continue
            
        selected.append(emp)
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
    
    return selected, violations

def assign_seats_greedy(employees: List[Employee], seats: List[Seat], weights: Dict[str, float], together_teams: List[List[str]] = []) -> tuple[List[AssignmentResult], List[str], List[str]]:
    """Greedy seat assignment algorithm"""
    assignments = []
    unassigned = []
    available_seats = seats.copy()
    
    # Calculate team zone bonuses
    team_zones = {}
    for team_group in together_teams:
        for team in team_group:
            team_zones[team] = {}
    
    # Assign seats greedily
    for employee in employees:
        best_seat = None
        best_score = -float('inf')
        best_reasons = {}
        
        for seat in available_seats:
            if not check_hard_constraints(employee, seat):
                continue
            
            # Calculate team cohesion bonus
            team_bonus = 0.0
            if employee.team in team_zones:
                zone_count = team_zones[employee.team].get(seat.zone, 0)
                team_bonus = zone_count * weights["w_zone_cohesion"]
            
            score, reasons = calculate_score(employee, seat, weights, team_bonus)
            
            if score > best_score:
                best_score = score
                best_seat = seat
                best_reasons = reasons
        
        if best_seat:
            assignments.append(AssignmentResult(
                employee_id=employee.employee_id,
                seat_id=best_seat.seat_id,
                score=best_score,
                reasons=best_reasons
            ))
            available_seats.remove(best_seat)
            
            # Update team zone tracking
            if employee.team in team_zones:
                team_zones[employee.team][best_seat.zone] = team_zones[employee.team].get(best_seat.zone, 0) + 1
        else:
            unassigned.append(employee.employee_id)
    
    unused_seats = [seat.seat_id for seat in available_seats]
    return assignments, unassigned, unused_seats

def assign_seats_hungarian(employees: List[Employee], seats: List[Seat], weights: Dict[str, float]) -> tuple[List[AssignmentResult], List[str], List[str]]:
    """Hungarian algorithm seat assignment"""
    if not SCIPY_AVAILABLE:
        raise HTTPException(status_code=400, detail="Hungarian solver requires scipy. Please use solver='greedy'")
    
    # Create cost matrix (negative scores for minimization)
    n_employees = len(employees)
    n_seats = len(seats)
    max_size = max(n_employees, n_seats)
    
    cost_matrix = np.full((max_size, max_size), 1000.0)  # High cost for dummy assignments
    score_matrix = {}
    reasons_matrix = {}
    
    for i, employee in enumerate(employees):
        for j, seat in enumerate(seats):
            if check_hard_constraints(employee, seat):
                score, reasons = calculate_score(employee, seat, weights)
                cost_matrix[i, j] = -score  # Negative for minimization
                score_matrix[(i, j)] = score
                reasons_matrix[(i, j)] = reasons
    
    # Solve assignment problem
    row_indices, col_indices = linear_sum_assignment(cost_matrix)
    
    assignments = []
    unassigned = []
    used_seats = set()
    
    for i, j in zip(row_indices, col_indices):
        if i < n_employees and j < n_seats and (i, j) in score_matrix:
            assignments.append(AssignmentResult(
                employee_id=employees[i].employee_id,
                seat_id=seats[j].seat_id,
                score=score_matrix[(i, j)],
                reasons=reasons_matrix[(i, j)]
            ))
            used_seats.add(j)
        elif i < n_employees:
            unassigned.append(employees[i].employee_id)
    
    unused_seats = [seats[j].seat_id for j in range(n_seats) if j not in used_seats]
    return assignments, unassigned, unused_seats

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": list(MODELS.keys()),
        "scipy_available": SCIPY_AVAILABLE,
        "version": "1.0.0"
    }

@app.post("/assign", response_model=AssignmentResponse)
async def assign_seats(request: AssignmentRequest):
    """Single-day seat assignment"""
    try:
        weights = get_weights(request.weights)
        
        # Limit assignments if specified
        employees = request.employees
        if request.max_assignments and len(employees) > request.max_assignments:
            employees = employees[:request.max_assignments]
        
        # Choose solver
        if request.solver == "hungarian":
            assignments, unassigned, unused = assign_seats_hungarian(employees, request.seats, weights)
        else:  # greedy
            assignments, unassigned, unused = assign_seats_greedy(employees, request.seats, weights)
        
        return AssignmentResponse(
            assignments=assignments,
            unassigned_employees=unassigned,
            unused_seats=unused,
            meta={
                "solver": request.solver,
                "total_employees": len(request.employees),
                "total_seats": len(request.seats),
                "assignment_rate": len(assignments) / len(request.employees) if request.employees else 0
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize/schedule", response_model=ScheduleResponse)
async def optimize_schedule(request: ScheduleRequest):
    """Multi-day weekly scheduling"""
    try:
        weights = get_weights(request.weights)
        violations = []
        attendance = {}
        assignments = {}
        
        for day in request.days:
            capacity = request.capacity_by_day.get(day, 50)
            
            # Select employees for this day
            day_employees, day_violations = select_daily_attendance(
                request.employees, day, capacity, request.dept_day_cap_pct
            )
            violations.extend(day_violations)
            
            # Check team togetherness constraints
            if request.team_together_mode == "hard":
                for team_group in request.together_teams:
                    team_members_present = [emp for emp in day_employees if emp.team in team_group]
                    if team_members_present:
                        zones = set()
                        for emp in team_members_present:
                            for seat in request.seats:
                                if check_hard_constraints(emp, seat):
                                    zones.add(seat.zone)
                                    break
                        if len(zones) > 1:
                            violations.append(f"Hard constraint violated: Team {team_group} cannot be kept together on {day}")
            
            # Assign seats for this day
            if request.solver == "hungarian":
                day_assignments, day_unassigned, day_unused = assign_seats_hungarian(
                    day_employees, request.seats, weights
                )
            else:
                day_assignments, day_unassigned, day_unused = assign_seats_greedy(
                    day_employees, request.seats, weights, request.together_teams
                )
            
            attendance[day] = [emp.employee_id for emp in day_employees]
            assignments[day] = day_assignments
        
        return ScheduleResponse(
            days=request.days,
            attendance=attendance,
            assignments=assignments,
            violations=violations,
            meta={
                "solver": request.solver,
                "total_employees": len(request.employees),
                "total_seats": len(request.seats),
                "dept_cap_pct": request.dept_day_cap_pct,
                "team_together_mode": request.team_together_mode
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/onsite_ratio")
async def predict_onsite_ratio(request: PredictRequest):
    """Predict onsite ratio for an employee"""
    if "onsite" not in MODELS:
        return {"prediction": None, "note": "Onsite ratio model not loaded"}
    
    try:
        # Extract features from record
        features = [
            request.record.get("commute_minutes", 30.0),
            request.record.get("availability_ratio", 1.0),
            len(request.record.get("preferred_days", [])),
        ]
        prediction = MODELS["onsite"].predict([features])[0]
        return {"prediction": float(prediction)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/seat_satisfaction")
async def predict_seat_satisfaction(request: PredictRequest):
    """Predict seat satisfaction probability"""
    if "seat" not in MODELS:
        return {"probability": None, "note": "Seat satisfaction model not loaded"}
    
    try:
        # Extract features from record
        features = [
            request.record.get("onsite_ratio", 0.5),
            request.record.get("project_count", 1.0),
            1.0 if request.record.get("is_window", False) else 0.0,
            1.0 if request.record.get("is_accessible", False) else 0.0,
            request.record.get("floor", 1),
        ]
        probability = MODELS["seat"].predict_proba([features])[0][1]
        return {"probability": float(probability)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/project_count")
async def predict_project_count(request: PredictRequest):
    """Predict project count for an employee"""
    if "project" not in MODELS:
        return {"prediction": None, "note": "Project count model not loaded"}
    
    try:
        # Extract features from record (customize based on your model)
        features = [
            request.record.get("department_code", 0),
            request.record.get("seniority_level", 1),
            request.record.get("team_size", 5),
        ]
        prediction = MODELS["project"].predict([features])[0]
        return {"prediction": float(prediction)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)