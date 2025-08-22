# Smart Office Seat Planner API

A rule-driven FastAPI backend for intelligent seat assignment and weekly scheduling.

## Features

- **Seat Assignment**: Single-day optimal seat allocation
- **Weekly Scheduling**: Multi-day attendance and seat planning
- **ML Integration**: Optional scikit-learn model support
- **Rule Engine**: Hard constraints + soft preferences
- **Multiple Solvers**: Greedy and Hungarian algorithms
- **What-if Simulation**: Prediction endpoints for planning

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

3. **Test with sample data:**
   - Visit: http://localhost:8000/docs
   - Use `sample_payload.json` for testing

## API Endpoints

### Core Functionality
- `GET /health` - Health check and model status
- `POST /assign` - Single-day seat assignment
- `POST /optimize/schedule` - Weekly scheduling with attendance selection

### ML Predictions (Optional)
- `POST /predict/onsite_ratio` - Predict employee onsite preference
- `POST /predict/seat_satisfaction` - Predict seat satisfaction probability  
- `POST /predict/project_count` - Predict employee project load

## Configuration

### Environment Variables
- `MODEL_DIR` - Directory containing ML models (default: "models")
- `MODEL_ONSITE` - Path to onsite ratio model
- `MODEL_SEAT` - Path to seat satisfaction model  
- `MODEL_PROJ` - Path to project count model

### Weights (Customizable)
- `w_seat_satisfaction`: 3.0 - ML seat satisfaction weight
- `w_onsite_ratio`: 2.0 - ML onsite ratio weight
- `w_project_penalty`: -0.05 - Project count penalty
- `w_window`: 1.0 - Window preference bonus
- `w_accessible`: 1.5 - Accessibility match bonus
- `w_zone`: 0.5 - Zone preference bonus
- `w_zone_cohesion`: 0.75 - Team zone cohesion bonus

## Rules & Constraints

### Hard Constraints
- Accessibility requirements must be met
- Daily capacity limits enforced
- Department daily ratio caps (default 60%)
- Team togetherness (when mode="hard")

### Soft Preferences
- Window seat preferences
- Zone preferences  
- Team zone cohesion
- Preferred work days
- ML-driven satisfaction scores

## Deployment

This backend needs to be deployed separately from your Lovable frontend:

**Recommended platforms:**
- Railway: `railway login && railway deploy`
- Render: Connect GitHub repo, auto-deploy
- DigitalOcean App Platform
- Google Cloud Run
- AWS ECS/Fargate

**Docker deployment:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Integration with Lovable Frontend

Update your frontend to call this API:

```typescript
const API_BASE = 'https://your-backend-url.com';

// Generate weekly schedule
const scheduleResponse = await fetch(`${API_BASE}/optimize/schedule`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(scheduleRequest)
});

// Single day assignment
const assignResponse = await fetch(`${API_BASE}/assign`, {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assignRequest)
});
```

## Sample Usage

See `sample_payload.json` for a complete example with:
- 2 employees (one needs accessible, one prefers window)
- 2 seats (one accessible, one window) 
- 5-day capacity planning
- Team grouping preferences
- Custom weights and Hungarian solver