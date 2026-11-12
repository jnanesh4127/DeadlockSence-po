# DeadlockSense

An interactive Operating System Deadlock Detection, Prevention & Banker's Algorithm Simulation Platform featuring real-time Resource Allocation Graph (RAG) and Wait-For Graph (WFG) analysis, automated safety verification, risk diagnostics, recovery planning, and comprehensive Administrator management with Firebase Authentication and Cloud Firestore.

## Features

- **Operating System Algorithm Engine**:
  - **Banker's Algorithm & Safety Check**: Computes Need matrix, Available vector, and verifies safe state with step-by-step trace and safe execution sequences.
  - **Resource Request Algorithm**: Tests resource allocation requests and prevents unsafe state transitions.
  - **Deadlock Detection**: Multi-instance resource matrix reduction algorithm identifying exact deadlocked processes.
  - **Resource Allocation Graph (RAG)**: Interactive visualizer distinguishing single-instance resources (where cycle is necessary and sufficient for deadlock) from multiple-instance resources.
  - **Wait-For Graph (WFG) Reduction**: Generates and inspects process-to-process dependency graphs.
  - **DFS Cycle Detection**: Extracts all cyclic dependency paths.
  - **Recovery Engine**: Process termination cost assessment and resource preemption planner with simulated post-recovery states.
  - **Deadlock Risk Assessment**: Computes utilization %, contention ratios, bottleneck diagnosis, and architectural recommendations.
- **Full Backend API**: All OS algorithm computations and evaluations execute securely on the Express backend (`/api/algorithms/*`).
- **Firebase Authentication**:
  - Email/Password login and registration
  - Google Sign-In with popup
  - Password reset and email verification
  - Persistent authentication session
  - Strict Token verification middleware (`verifyFirebaseToken`)
- **Single Administrator Architecture**:
  - Designated Administrator: `jnanesh4127@gmail.com`
  - Enforced via Firebase Custom Claims (`{ admin: true }`) and server-side RBAC middleware (`requireAdmin`)
  - Admin Dashboard for viewing all users, account status toggle, simulation records, feedback resolution, analytics, and CSV exports.
- **Cloud Firestore Storage**:
  - User profiles (`users/{uid}`)
  - Simulation scenarios (`simulations/{simulationId}`)
  - Feedback submissions (`feedback/{feedbackId}`)
  - Audit logs (`simulationEvents/{eventId}`)
  - Practice records (`practiceResults/{resultId}`)
  - Hardened Zero-Trust `firestore.rules` adhering to the 8 pillars of Firestore security.
- **User Feedback & Notifications**:
  - Feedback submission modal with ratings and categories
  - Nodemailer email alerts sent to `jnanesh4127@gmail.com` on submission.

---

## Project Structure

```
DeadlockSense/
|-- client/
|   |-- src/
|   |-- public/
|   |-- package.json
|   |-- .env.example
|-- server/
|   |-- src/
|   |   |-- algorithms/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- app.ts
|   |   |-- server.ts
|   |-- tests/
|   |   |-- algorithms.test.ts
|   |   |-- api.test.ts
|   |-- package.json
|   |-- .env.example
|-- firebase/
|   |-- firestore.rules
|   |-- firestore.indexes.json
|-- scripts/
|   |-- provision-admin.ts
|-- src/
|   |-- algorithms/
|   |-- components/
|   |-- context/
|   |-- firebase/
|   |-- services/
|   |-- App.tsx
|   |-- main.tsx
|-- firebase-blueprint.json
|-- firestore.rules
|-- server.ts
|-- package.json
|-- README.md
```

---

## Setup & Running the Application

### 1. Unified Full-Stack (Recommended)

Run both the Express backend API and Vite dev server on port 3000 simultaneously:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Running Standalone Server & Client

To run the backend independently on port 5000:
```bash
npm run server:dev
```

To run the client independently on port 3000:
```bash
npm run client:dev
```

### 3. Provisioning the Single Administrator

To assign `{ admin: true }` custom claims to `jnanesh4127@gmail.com`:
```bash
npm run provision:admin
```

### 4. Running Automated Tests

Run the full Vitest suite covering OS algorithms, safety checks, cycle detection, authorization, and data isolation:
```bash
npm test
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```ini
# Firebase Client
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# Admin & Notifications
ADMIN_EMAIL="jnanesh4127@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
```
