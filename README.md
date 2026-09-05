<div align="center">

# 💻 Hardware Point POS — Frontend Client Architecture & Guide

### Enterprise React 18 Single-Page Application with Ant Design v5, TanStack Query & 4-Tier Clean Architecture

<p>
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Ant%20Design-5.12.6-0170FE?style=for-the-badge&logo=ant-design&logoColor=white" />
  <img src="https://img.shields.io/badge/TanStack%20Query-v5.x-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux-5.0.1-764ABC?style=for-the-badge&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-2.12.6-22b5bf?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-Permission--Required-red?style=for-the-badge" />
</p>

</div>

---

## 🏛️ 4-Tier Frontend Clean Architecture

The client application enforces a strict **4-Tier Clean Architecture** model to prevent the mixing of UI rendering, side-effect mutations, mathematical calculations, and remote HTTP requests.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       TIER 1: PRESENTATION LAYER (src/pages/ & src/components/)              │
│  • Homepage.js · Cartpage.js · Billspage.js · Itempage.js · Stockpage.js · UserManagement.js│
│  • Defaultlayouts.js (App Shell) · PrivateRoute.js (RBAC Route Guard)                       │
│  • Responsible EXCLUSIVELY for Ant Design UI layout, local state, and event dispatching     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
┌───────────────────────▼──────────────────────┐    ┌─────────────────▼───────────────────────┐
│     TIER 2: ACTION & CRUD HANDLERS           │    │    TIER 3: PURE MATHEMATICAL            │
│            (src/handlers/)                   │    │    CALCULATORS (src/calculaters/)       │
│  • posHandlers.js: Add to cart, barcode scan │    │  • stockCalculations.js: Margin, COGS   │
│  • billsHandlers.js: Invoice updates/delete  │    │  • billCalculations.js: Revenue math    │
│  • cartHandlers.js: Checkout mutation        │    │  • cartCalculations.js: Subtotals, tax  │
│  • itemHandlers.js: Product create/edit      │    │  • itemCalculations.js: Stock alerts    │
│  • errorHandler.js: Centralized error toasts │    │  • posCalculations.js: Search & lookup  │
│  (Orchestrates business operations & toasts) │    │  (Zero side effects, 100% testable)     │
└───────────────────────┬──────────────────────┘    └─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────────────────────────────────┐
│                     TIER 4: SERVICE & DATA ACCESS LAYER (src/services/ & src/hooks/)         │
│  • Domain Services: productService.js · billService.js · dealerService.js · userService.js  │
│  • State Synchronization: usePosQueries.js (TanStack React Query Cache Engine)              │
│  • Client Session: rootReducer.js (Persistent Redux Cart Store)                             │
│  • Transport: api/client.js (Axios Client with Bearer JWT Token Interceptor)                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Mermaid Architectural Diagrams

### 1. 4-Tier Frontend Dataflow & Decoupling

```mermaid
graph TD
    subgraph Presentation["Tier 1: Presentation Layer"]
        Page["React Page Component\n(e.g., Stockpage.js)"]
    end

    subgraph Calculators["Tier 3: Pure Calculators"]
        Calc["stockCalculations.js\ncalculateFinancialMetrics()"]
    end

    subgraph Handlers["Tier 2: Action Handlers"]
        Handler["stockHandlers.js\nAction Dispatcher"]
        ErrUtil["errorHandler.js\nnotifyError() & notifySuccess()"]
    end

    subgraph DataAccess["Tier 4: Service & Data Access"]
        Query["usePosQueries.js\nuseProducts() & useBills()"]
        Svc["productService.js & billService.js"]
        Axios["api/client.js\nBearer Token Interceptor"]
    end

    Page -->|"Observes reactive query data"| Query
    Query -->|"Calls API abstractions"| Svc
    Svc -->|"Executes HTTP requests"| Axios
    Page -->|"Passes raw data for computation"| Calc
    Calc -->>|"Returns pure KPI metrics"| Page
    Page -->|"Dispatches user submit/delete"| Handler
    Handler -->|"Calls service mutations"| Svc
    Handler -->|"Intercepts exceptions"| ErrUtil
    ErrUtil -->>|"Renders uniform toast"| Page
```

---

### 2. Component Layout & RBAC Shell Hierarchy

```mermaid
graph TD
    App["App.js (BrowserRouter)"]
    PR["PrivateRoute.js (Auth & Role Check)"]
    Shell["Defaultlayouts.js (App Shell)"]
    
    Header["Ant Design Header\n(Brand, User Info, Cart Badge, User Mgmt Button)"]
    Sider["Ant Design Desktop Sider\n(Navigation Menu Items)"]
    Drawer["Ant Design Mobile Drawer\n(Off-Canvas Navigation Menu)"]
    Content["Layout.Content (Active Route View)"]

    App --> PR
    PR --> Shell
    Shell --> Header
    Shell --> Sider
    Shell --> Drawer
    Shell --> Content

    Content --> P_POS["/ (Homepage - POS Grid)"]
    Content --> P_Cart["/cart (Cartpage - Review)"]
    Content --> P_Bills["/bills (Billspage - Invoices)"]
    Content --> P_Items["/items (Itempage - Catalog)"]
    Content --> P_Stock["/stock (Stockpage - Analytics)"]
    Content --> P_Dealers["/dealers (Dealerspage)"]
    Content --> P_Charges["/charges (Charges)"]
    Content --> P_Users["/users (UserManagement - Admin Only)"]
```

---

### 3. TanStack Query Cache Invalidation Dependency Graph

```mermaid
flowchart TD
    subgraph Mutations["POS Mutations"]
        M1["useCheckoutMutation (Complete Sale)"]
        M2["addProduct / editProduct / deleteProduct"]
        M3["editBill / deleteBill"]
        M4["addCharge / editCharge / deleteCharge"]
        M5["createUser / toggleStatus / updateRole / deleteUser"]
    end

    subgraph QueryCaches["TanStack Query Caches"]
        Q_Prod["products cache"]
        Q_Bill["bills cache"]
        Q_Stock["stockAnalytics cache"]
        Q_Charge["charges cache"]
        Q_Deal["dealers cache"]
        Q_User["users cache"]
    end

    M1 -->|Invalidates| Q_Prod
    M1 -->|Invalidates| Q_Bill
    M1 -->|Invalidates| Q_Stock

    M2 -->|Invalidates| Q_Prod
    M2 -->|Invalidates| Q_Stock

    M3 -->|Invalidates| Q_Bill
    M3 -->|Invalidates| Q_Stock

    M4 -->|Invalidates| Q_Charge
    M4 -->|Invalidates| Q_Stock

    M5 -->|Invalidates| Q_User
```

---

### 4. Barcode Hardware Scanner Keystroke Loop

```mermaid
sequenceDiagram
    participant Hardware as 🔫 USB/Bluetooth Scanner
    participant FocusHook as usePosShortcuts.js
    participant Receptor as useBarcodeScanner.js
    participant Handler as posHandlers.js
    participant Store as Redux Store

    Note over FocusHook: Operator presses F2
    FocusHook->>Receptor: focusScanner()
    Hardware->>Receptor: Sends rapid keystroke sequence (EAN-13 code)
    Hardware->>Receptor: Sends 'Enter' key terminator
    Receptor->>Handler: handleBarcodeScan(scannedCode)
    Handler->>Handler: findProductByCode(products, code)
    alt Product Exists & Stock Available
        Handler->>Store: dispatch({ type: "ADD_TO_CART", payload: product })
        Store-->>Handler: Cart items count incremented
        Handler->>Receptor: Reset input buffer
    else Product Not Found or Depleted
        Handler->>Receptor: Trigger error sound / Ant Design error toast
    end
```

---

## 📂 Client Directory Structure

```
📂 client/
├── 📄 .env.example                               # Client environment template
├── 📄 package.json                               # Dependencies & scripts
├── 📄 README.md                                  # Frontend architectural guide
├── 📁 public/
│   ├── 📄 favicon.ico                            # Hardware Point POS favicon
│   ├── 📄 index.html                             # Single Page Application HTML shell
│   └── 📄 manifest.json                          # PWA manifest
└── 📁 src/
    ├── 📄 App.js                                 # Route registration & role protection
    ├── 📄 index.js                               # Root render, QueryClientProvider, RAF ResizeObserver
    ├── 📄 index.css                              # Base typography & thermal receipt print styles
    ├── 📁 api/
    │   └── 📄 client.js                          # Axios HTTP instance with Bearer JWT interceptor
    ├── 📁 services/                              # Tier 4: Remote Service Modules
    │   ├── 📄 productService.js                  # Product catalog API endpoints
    │   ├── 📄 billService.js                     # Invoices & checkout API endpoints
    │   ├── 📄 dealerService.js                   # Vendor directory API endpoints
    │   ├── 📄 chargeService.js                   # Store expense API endpoints
    │   ├── 📄 userService.js                     # Staff user management API endpoints
    │   └── 📄 index.js                           # Services barrel export
    ├── 📁 handlers/                              # Tier 2: Action & CRUD Event Handlers
    │   ├── 📄 posHandlers.js                     # Barcode scan & cart dispatch handlers
    │   ├── 📄 billsHandlers.js                   # Invoice update & delete action handlers
    │   ├── 📄 cartHandlers.js                    # Checkout submission & confetti orchestration
    │   ├── 📄 itemHandlers.js                    # Product submit & delete action handlers
    │   └── 📄 stockHandlers.js                   # Stock analytics action wrappers
    ├── 📁 calculaters/                           # Tier 3: Pure Business & Math Calculators
    │   ├── 📄 billCalculations.js                # Invoice stats, date formatting, filter logic
    │   ├── 📄 stockCalculations.js               # Gross profit, COGS, margins, category charts
    │   ├── 📄 cartCalculations.js                # Cart subtotals, line totals, tender change
    │   ├── 📄 itemCalculations.js                # Inventory valuations, category indexing
    │   └── 📄 posCalculations.js                 # Product search algorithms & barcode match
    ├── 📁 hooks/                                 # Custom React Hooks
    │   ├── 📄 usePosQueries.js                   # Centralized TanStack Query cache hooks
    │   ├── 📄 useBarcodeScanner.js               # Hardware scanner keystroke receptor hook
    │   └── 📄 usePosShortcuts.js                 # Global F2, F4, Esc, Ctrl+K hotkey bindings
    ├── 📁 redux/                                 # Local State & Cart Slices
    │   ├── 📄 store.js                           # Redux store with thunk middleware
    │   └── 📄 rootReducer.js                     # Cart items, persistent hydration, loading
    ├── 📁 pages/                                 # Tier 1: Pure Presentation Components
    │   ├── 📄 Homepage.js                        # POS catalog grid & active cashier terminal
    │   ├── 📄 Cartpage.js                        # Full basket review & tender modal
    │   ├── 📄 Billspage.js                       # Invoice log & 80mm thermal receipt viewer
    │   ├── 📄 Itempage.js                        # Inventory directory & product modal CRUD
    │   ├── 📄 Stockpage.js                       # Business intelligence & Recharts dashboard
    │   ├── 📄 UserManagement.js                  # Admin operator RBAC management panel
    │   ├── 📄 Dealerspage.js                     # Wholesale supplier directory & modal
    │   ├── 📄 Charges.js                         # Store operational expense management
    │   ├── 📄 LoginForm.js                       # Operator login with token storage
    │   └── 📄 ChangePasswordForm.js              # Password update security interface
    ├── 📁 components/                            # Shared Visual Components
    │   ├── 📄 Defaultlayouts.js                  # Responsive sidebar, header, mobile drawer
    │   ├── 📄 PrivateRoute.js                    # Role-based route guard component
    │   └── 📄 ItemsList.js                       # Reusable product card item
    ├── 📁 styles/                                # Theme & Layout Stylesheets
    │   ├── 📄 Pos.css                            # Product cards, dock, mobile floating bar
    │   └── 📄 Defaultlayouts.css                 # CSS variables, responsive breakpoints
    └── 📁 utils/                                 # Shared Frontend Utilities
        └── 📄 errorHandler.js                    # Centralized Ant Design notification handler
```

---

## 🎨 Design System & CSS Variables

Custom design tokens are maintained in [`client/src/styles/Defaultlayouts.css`](file:///d:/mern-pos/client/src/styles/Defaultlayouts.css):

```css
:root {
  --primary-color: #183c35;       /* Deep Forest Green */
  --primary-light: #22614e;       /* Medium Forest Accent */
  --secondary-color: #f2c14e;     /* Warm Gold / Highlight */
  --accent-green: #2d8a55;        /* Success Emerald */
  --bg-color: #f4f7f4;            /* Soft Terminal Canvas */
  --card-bg: #ffffff;             /* Crisp Card Surface */
  --text-primary: #183c35;        /* Primary Slate */
  --text-secondary: #6e7d75;      /* Subtitle Grey */
  --border-radius: 12px;          /* Smooth Corner Curves */
  --transition: all 0.25s ease;   /* Fluid Animations */
}
```

---

## ⌨️ POS Keyboard Shortcuts & Hotkeys

| Hotkey | Target / Function | Handler Location |
|---|---|---|
| **`F2`** | Focus barcode scanner input field | `src/hooks/usePosShortcuts.js` |
| **`F4`** | Open checkout payment modal with tendered cash focus | `src/hooks/usePosShortcuts.js` |
| **`Ctrl + K`** | Focus search input field across product catalog | `src/hooks/usePosShortcuts.js` |
| **`Esc`** | Dismiss active modal, clear search query, or close drawer | `src/hooks/usePosShortcuts.js` |

---

## 🖨️ 80mm Thermal Receipt ESC/POS Print Specs

Printing is configured with specialized `@media print` rules in [`Billspage.js`](file:///d:/mern-pos/client/src/pages/Billspage.js):
- Width fixed to **`80mm`** with `0 margin`.
- All surrounding UI, sidebar, headers, and modal controls are suppressed (`visibility: hidden`).
- Receipt container centered at top: `position: absolute; left: 50%; transform: translateX(-50%)`.
- High-contrast monospace font rendering for clean thermal head output.

---

## ⚙️ Configuration & Available Scripts

Create `.env` using `.env.example`:
```bash
cp .env.example .env
```

| Environment Variable | Description |
|---|---|
| `PORT=3000` | Local React development server port |
| `REACT_APP_API_URL=/api` | Base API route (proxied via `package.json` to `http://localhost:8080`) |

### Command Scripts

```bash
# Launch development environment (hot-reloading enabled)
npm start

# Run unit tests with Jest runner
npm test

# Build production-ready, minified bundle
npm run build
```

---

## 🤝 Contributing

Contributions must follow the 4-Tier Clean Architecture rules. Ensure `npm run build` exits with code 0. See root [`CONTRIBUTING.md`](file:///d:/mern-pos/CONTRIBUTING.md).

---

## 📄 License

This frontend is governed by the **Hardware Point POS Permission-Based Non-Commercial License**. Free for personal/educational evaluation upon requesting permission from [Haider Ali](https://github.com/Haiderali445). Commercial use and resale are prohibited. See [LICENSE](file:///d:/mern-pos/LICENSE).
