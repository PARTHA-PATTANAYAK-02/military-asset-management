import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

const BASES = [
  { id: 1, name: "Alpha Base" },
  { id: 2, name: "Bravo Base" },
  { id: 3, name: "Charlie Base" },
];

const EQUIPMENT = [
  { id: 1, name: "Utility Vehicle" },
  { id: 2, name: "Radio Set" },
  { id: 3, name: "Medical Kit" },
  { id: 4, name: "Fuel Container" },
];

function localDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

const emptyFilters = { baseId: "", equipmentTypeId: "", from: "", to: "" };

/* ---------- Icons ---------- */
const Icon = {
  Dashboard: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Purchases: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.55L21 8H6" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  ),
  Transfers: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M7 4v13" />
      <path d="M4 14l3 3 3-3" />
      <path d="M17 20V7" />
      <path d="M14 10l3-3 3 3" />
    </svg>
  ),
  Assignments: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  Expenditures: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  ),
  ArrowUpRight: (p) => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  ),
  Swap: (p) => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M7 4v13" />
      <path d="M4 14l3 3 3-3" />
      <path d="M17 20V7" />
      <path d="M14 10l3-3 3 3" />
    </svg>
  ),
  Target: (p) => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Minus: (p) => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  ),
  Box: (p) => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  Check: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Alert: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
  Menu: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...p}
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  ),
  Logout: (p) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: Icon.Dashboard },
  { key: "purchases", label: "Purchases", Icon: Icon.Purchases },
  { key: "transfers", label: "Transfers", Icon: Icon.Transfers },
  { key: "assignments", label: "Assignments", Icon: Icon.Assignments },
  { key: "expenditures", label: "Expenditures", Icon: Icon.Expenditures },
];

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    sub: "Real-time inventory overview",
    eyebrow: "OVERVIEW",
    hero: {
      eyebrow: "ASSET INTELLIGENCE",
      title: "Inventory overview",
      text: "Track stock, movements and asset accountability across every base.",
    },
  },
  purchases: {
    title: "Purchases",
    sub: "Record and review procurement",
    eyebrow: "PROCUREMENT",
    hero: {
      eyebrow: "INVENTORY PROCUREMENT",
      title: "Purchase management",
      text: "Record new purchases and review transaction history.",
    },
  },
  transfers: {
    title: "Transfers",
    sub: "Move assets between bases",
    eyebrow: "MOVEMENT",
    hero: {
      eyebrow: "INVENTORY MOVEMENT",
      title: "Transfer management",
      text: "Move assets between bases and track every transfer.",
    },
  },
  assignments: {
    title: "Assignments",
    sub: "Assign equipment to personnel",
    eyebrow: "PERSONNEL",
    hero: {
      eyebrow: "PERSONNEL & INVENTORY",
      title: "Asset assignments",
      text: "Assign equipment to personnel and track returns with full accountability.",
    },
  },
  expenditures: {
    title: "Expenditures",
    sub: "Record expended assets",
    eyebrow: "ACCOUNTABILITY",
    hero: {
      eyebrow: "ASSET ACCOUNTABILITY",
      title: "Expenditures",
      text: "Record and review expended assets across all bases.",
    },
  },
};

/* ---------- Reusable ---------- */
function Hero({ meta, symbol }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="eyebrow">{meta.eyebrow}</p>
        <h2 className="hero-title">{meta.title}</h2>
        <p className="hero-sub">{meta.text}</p>
      </div>
      <div className="hero-art">
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="ring ring-3" />
        {symbol || <Icon.Box />}
      </div>
    </section>
  );
}

function Field({ label, id, children }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SpinnerBtn({
  loading,
  loadingText,
  children,
  onClick,
  type = "submit",
}) {
  return (
    <button
      className="btn btn-primary"
      type={type}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <span className="spinner" />
          <span className="btn-label">{loadingText}</span>
        </>
      ) : (
        <span className="btn-label">{children}</span>
      )}
    </button>
  );
}

function Empty({ children }) {
  return (
    <tr className="row-empty">
      <td colSpan="9">
        <div className="empty-inner">
          <Icon.Box />
          <span>{children}</span>
        </div>
      </td>
    </tr>
  );
}

/* ---------- App ---------- */
function App() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    timersRef.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      delete timersRef.current[id];
    }, 4200);
  }, []);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    },
    [],
  );

  const [purchaseForm, setPurchaseForm] = useState({
    baseId: "1",
    equipmentTypeId: "1",
    quantity: "1",
    purchaseDate: localDate(),
    notes: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    baseId: "1",
    equipmentTypeId: "1",
    personnelName: "",
    quantity: "1",
  });
  const [expenditureForm, setExpenditureForm] = useState({
    baseId: "1",
    equipmentTypeId: "1",
    quantity: "1",
    expenditureDate: localDate(),
    reason: "",
  });
  const [transferForm, setTransferForm] = useState({
    fromBaseId: "1",
    toBaseId: "2",
    equipmentTypeId: "1",
    quantity: "1",
    transferDate: localDate(),
    notes: "",
  });

  const request = useCallback(
    async (path, options = {}, authToken = token) => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...options.headers,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      return data;
    },
    [token],
  );

  const loadDashboard = useCallback(
    async (t = token) => {
      const data = await request("/dashboard", {}, t);
      setDashboard(data.dashboard);
    },
    [request, token],
  );

  const buildQuery = (active) => {
    const q = new URLSearchParams();
    Object.entries(active).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return q.toString();
  };

  const loadPurchases = useCallback(
    async (t = token, active = filters) => {
      const q = buildQuery(active);
      const data = await request(`/purchases${q ? `?${q}` : ""}`, {}, t);
      setPurchases(data.purchases || []);
    },
    [request, token, filters],
  );

  const loadTransfers = useCallback(
    async (t = token, active = filters) => {
      const q = buildQuery(active);
      const data = await request(`/transfers${q ? `?${q}` : ""}`, {}, t);
      setTransfers(data.transfers || []);
    },
    [request, token, filters],
  );

  const loadAssignments = useCallback(
    async (t = token, baseFilter = "") => {
      const q = baseFilter ? `?baseId=${encodeURIComponent(baseFilter)}` : "";
      const data = await request(`/assignments${q}`, {}, t);
      setAssignments(data.assignments || []);
    },
    [request, token],
  );

  const loadExpenditures = useCallback(
    async (t = token, active = filters) => {
      const q = buildQuery(active);
      const data = await request(`/expenditures${q ? `?${q}` : ""}`, {}, t);
      setExpenditures(data.expenditures || []);
    },
    [request, token, filters],
  );

  async function login(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        "",
      );

      // Login succeeded — keep the authenticated session.
      setToken(data.token);
      setUser(data.user);

      pushToast("success", "Signed in successfully.");

      // Dashboard is restricted to Admin and Base Commander.
      const requests = [
        loadPurchases(data.token, emptyFilters),
        loadTransfers(data.token, emptyFilters),
      ];

      if (data.user.role === "ADMIN" || data.user.role === "BASE_COMMANDER") {
        requests.unshift(loadDashboard(data.token));
      }

      const results = await Promise.allSettled(requests);

      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Post-login data loading error:", result.reason);
        }
      });
    } catch (err) {
      setToken("");
      setUser(null);
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (
      !["purchases", "transfers", "assignments", "expenditures"].includes(page)
    )
      return;
    let cancelled = false;
    async function refresh() {
      setLoading(true);
      try {
        if (page === "purchases") await loadPurchases(token, filters);
        else if (page === "transfers") await loadTransfers(token, filters);
        else if (page === "assignments")
          await loadAssignments(token, filters.baseId);
        else if (page === "expenditures")
          await loadExpenditures(token, filters);
      } catch (err) {
        if (!cancelled) pushToast("error", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refresh();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    page,
    filters,
    loadPurchases,
    loadTransfers,
    loadAssignments,
    loadExpenditures,
    pushToast,
  ]);

  async function submitPurchase(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await request("/purchases", {
        method: "POST",
        body: JSON.stringify({
          ...purchaseForm,
          baseId: Number(purchaseForm.baseId),
          equipmentTypeId: Number(purchaseForm.equipmentTypeId),
          quantity: Number(purchaseForm.quantity),
        }),
      });
      await Promise.all([loadPurchases(token, filters), loadDashboard(token)]);
      pushToast("success", "Purchase recorded successfully.");
      setPurchaseForm((v) => ({ ...v, quantity: "1", notes: "" }));
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitTransfer(e) {
    e.preventDefault();
    if (transferForm.fromBaseId === transferForm.toBaseId) {
      pushToast("error", "Source and destination bases must be different.");
      return;
    }
    setLoading(true);
    try {
      const data = await request("/transfers", {
        method: "POST",
        body: JSON.stringify({
          ...transferForm,
          fromBaseId: Number(transferForm.fromBaseId),
          toBaseId: Number(transferForm.toBaseId),
          equipmentTypeId: Number(transferForm.equipmentTypeId),
          quantity: Number(transferForm.quantity),
        }),
      });
      await Promise.all([
        loadTransfers(token, filters),
        loadDashboard(token),
        loadPurchases(token, emptyFilters),
      ]);
      pushToast(
        "success",
        `${data.message}. Available stock: ${data.availableStockAfterTransfer}.`,
      );
      setTransferForm((v) => ({ ...v, quantity: "1", notes: "" }));
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAssignment(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await request("/assignments", {
        method: "POST",
        body: JSON.stringify({
          ...assignmentForm,
          baseId: Number(assignmentForm.baseId),
          equipmentTypeId: Number(assignmentForm.equipmentTypeId),
          quantity: Number(assignmentForm.quantity),
        }),
      });
      await Promise.all([
        loadAssignments(token, filters.baseId),
        loadDashboard(token),
      ]);
      pushToast(
        "success",
        `${data.message}. Stock: ${data.availableStockAfterAssignment}.`,
      );
      setAssignmentForm((v) => ({ ...v, personnelName: "", quantity: "1" }));
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function returnAssignment(id) {
    setLoading(true);
    try {
      const data = await request(`/assignments/${id}/return`, {
        method: "PATCH",
      });
      await Promise.all([
        loadAssignments(token, filters.baseId),
        loadDashboard(token),
      ]);
      pushToast("success", data.message);
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitExpenditure(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await request("/expenditures", {
        method: "POST",
        body: JSON.stringify({
          ...expenditureForm,
          baseId: Number(expenditureForm.baseId),
          equipmentTypeId: Number(expenditureForm.equipmentTypeId),
          quantity: Number(expenditureForm.quantity),
        }),
      });
      await Promise.all([
        loadExpenditures(token, filters),
        loadDashboard(token),
      ]);
      pushToast(
        "success",
        `${data.message}. Stock: ${data.availableStockAfterExpenditure}.`,
      );
      setExpenditureForm((v) => ({ ...v, quantity: "1", reason: "" }));
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    setDashboard(null);
    setPurchases([]);
    setTransfers([]);
    setAssignments([]);
    setExpenditures([]);
    setPassword("");
    setPage("dashboard");
    setSidebarOpen(false);
  }

  function openPage(next) {
    setPage(next);
    setFilters(emptyFilters);
    setSidebarOpen(false);
  }

  const updateFilter = (key, value) =>
    setFilters((c) => ({ ...c, [key]: value }));

  function renderFilters() {
    return (
      <div className="filter-grid">
        <Field label="Base" id="f-base">
          <select
            id="f-base"
            value={filters.baseId}
            onChange={(e) => updateFilter("baseId", e.target.value)}
          >
            <option value="">All bases</option>
            {BASES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Equipment" id="f-eq">
          <select
            id="f-eq"
            value={filters.equipmentTypeId}
            onChange={(e) => updateFilter("equipmentTypeId", e.target.value)}
          >
            <option value="">All equipment</option>
            {EQUIPMENT.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From date" id="f-from">
          <input
            id="f-from"
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter("from", e.target.value)}
          />
        </Field>
        <Field label="To date" id="f-to">
          <input
            id="f-to"
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter("to", e.target.value)}
          />
        </Field>
      </div>
    );
  }

  /* ---------- LOGIN ---------- */
  if (!token) {
    return (
      <>
        <main className="login-page">
          <aside className="login-visual">
            <div className="login-visual-inner">
              <div className="brand">
                <span className="brand-mark">AM</span>
                <div className="brand-text">
                  <strong>AssetFlow</strong>
                  <small>Management System</small>
                </div>
              </div>
              <h1 className="login-headline">
                Welcome to <em>AssetFlow</em>
              </h1>
              <p className="login-sub">
                One unified platform for tracking inventory, movements and asset
                accountability across every base.
              </p>
              <div className="feature-list">
                <div className="feature">
                  <span className="feature-dot">
                    <Icon.Check />
                  </span>{" "}
                  Live inventory across all bases
                </div>
                <div className="feature">
                  <span className="feature-dot">
                    <Icon.Check />
                  </span>{" "}
                  Purchases, transfers & assignments
                </div>
                <div className="feature">
                  <span className="feature-dot">
                    <Icon.Check />
                  </span>{" "}
                  Full audit trail for every movement
                </div>
              </div>
            </div>
          </aside>

          <section className="login-panel">
            <form className="login-card" onSubmit={login}>
              <div className="login-card-head">
                <p className="eyebrow">Asset Control Platform</p>
                <h1>Welcome back</h1>
                <p>Sign in to manage your inventory.</p>
              </div>

              <div className="form-stack">
                <Field label="Email address" id="email">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password" id="password">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <SpinnerBtn loading={loading} loadingText="Signing in…">
                  Sign in
                </SpinnerBtn>
              </div>

              <p className="login-foot">AssetFlow · Secure Management Access</p>
            </form>
          </section>
        </main>

        <ToastStack toasts={toasts} setToasts={setToasts} />
      </>
    );
  }

  /* ---------- METRICS ---------- */
  const metrics = dashboard
    ? [
        {
          label: "Opening Balance",
          value: dashboard.openingBalance,
          color: "#7fe0a6",
          Icon: Icon.ArrowUpRight,
        },
        {
          label: "Net Movement",
          value: dashboard.netMovement,
          color: "#7ba7ff",
          Icon: Icon.Swap,
        },
        {
          label: "Assigned Assets",
          value: dashboard.assigned,
          color: "#b393ff",
          Icon: Icon.Target,
        },
        {
          label: "Expended Assets",
          value: dashboard.expended,
          color: "#ff8ba0",
          Icon: Icon.Minus,
        },
        {
          label: "Closing Balance",
          value: dashboard.closingBalance,
          color: "#63dced",
          Icon: Icon.Box,
        },
      ]
    : [];

  const maxMovement = dashboard
    ? Math.max(
        dashboard.purchases,
        dashboard.transferIn,
        dashboard.transferOut,
        1,
      )
    : 1;

  const meta = PAGE_META[page];

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="scrim" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <span className="brand-mark">AM</span>
          <div className="brand-text">
            <strong>AssetFlow</strong>
            <small>Management System</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <p className="nav-heading">Workspace</p>
            {NAV.map(({ key, label, Icon: I }) => (
              <button
                key={key}
                className={`nav-item ${page === key ? "active" : ""}`}
                onClick={() => openPage(key)}
              >
                <I />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <span className="avatar">
              {(user?.email || "AM").slice(0, 2).toUpperCase()}
            </span>
            <div className="user-meta">
              <strong>{user?.email || "User"}</strong>
              <span>{user?.role?.replaceAll("_", " ") || "Member"}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon.Menu />
            </button>
            <div className="topbar-titles">
              <p className="eyebrow">{meta.eyebrow}</p>
              <h1 className="page-title">{meta.title}</h1>
              <p className="page-sub">{meta.sub}</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="status-pill">
              <span className="status-dot" /> API connected
            </span>
            <button className="btn btn-ghost" onClick={logout}>
              <Icon.Logout />
              <span className="btn-label">Sign out</span>
            </button>
          </div>
        </header>

        <div className="content">
          {/* ============ DASHBOARD ============ */}
          {page === "dashboard" && (
            <>
              <Hero meta={meta.hero} />
              <div className="section-head">
                <div>
                  <h2 className="section-title">Key metrics</h2>
                  <p className="section-sub">Live data from your database</p>
                </div>
                <span className="live-badge">
                  <span className="status-dot" /> Live
                </span>
              </div>
              <section className="stats-grid">
                {metrics.map((m, i) => (
                  <article
                    className="stat-card"
                    key={m.label}
                    style={{
                      "--accent": m.color,
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className="stat-top">
                      <span className="stat-label">{m.label}</span>
                      <span className="stat-icon">
                        <m.Icon />
                      </span>
                    </div>
                    <strong className="stat-value">
                      {Number(m.value).toLocaleString()}
                    </strong>
                    <p className="stat-foot">Total quantity</p>
                  </article>
                ))}
              </section>

              {dashboard && (
                <section className="panel" style={{ marginTop: 22 }}>
                  <div className="section-head" style={{ margin: "0 0 6px" }}>
                    <div>
                      <h2 className="section-title">Net movement breakdown</h2>
                      <p className="section-sub">
                        Purchases and transfers recorded in the system
                      </p>
                    </div>
                  </div>
                  <div className="movement-list">
                    <div className="movement-row">
                      <span className="movement-label">Purchases</span>
                      <div className="meter">
                        <i
                          style={{
                            width: `${(dashboard.purchases / maxMovement) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>+{dashboard.purchases}</strong>
                    </div>
                    <div className="movement-row">
                      <span className="movement-label">Transfer in</span>
                      <div className="meter blue">
                        <i
                          style={{
                            width: `${(dashboard.transferIn / maxMovement) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>+{dashboard.transferIn}</strong>
                    </div>
                    <div className="movement-row">
                      <span className="movement-label">Transfer out</span>
                      <div className="meter rose">
                        <i
                          style={{
                            width: `${(dashboard.transferOut / maxMovement) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>−{dashboard.transferOut}</strong>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ============ PURCHASES ============ */}
          {page === "purchases" && (
            <>
              <Hero meta={meta.hero} symbol={<Icon.Purchases />} />

              <section className="panel form-card">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Record a purchase</h2>
                    <p className="section-sub">
                      Enter the asset and purchase details.
                    </p>
                  </div>
                </div>
                <form className="form-grid" onSubmit={submitPurchase}>
                  <Field label="Base" id="p-base">
                    <select
                      id="p-base"
                      value={purchaseForm.baseId}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          baseId: e.target.value,
                        })
                      }
                      required
                    >
                      {BASES.filter(
                        (b) =>
                          user?.role !== "BASE_COMMANDER" ||
                          b.id === user.baseId,
                      ).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Equipment type" id="p-eq">
                    <select
                      id="p-eq"
                      value={purchaseForm.equipmentTypeId}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          equipmentTypeId: e.target.value,
                        })
                      }
                    >
                      {EQUIPMENT.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity" id="p-qty">
                    <input
                      id="p-qty"
                      type="number"
                      min="1"
                      step="1"
                      value={purchaseForm.quantity}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          quantity: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Purchase date" id="p-date">
                    <input
                      id="p-date"
                      type="date"
                      value={purchaseForm.purchaseDate}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          purchaseDate: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <div className="field full-field">
                    <label className="field-label" htmlFor="p-notes">
                      Notes (optional)
                    </label>
                    <input
                      id="p-notes"
                      maxLength="500"
                      value={purchaseForm.notes}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add a short note"
                    />
                  </div>
                  <div className="form-actions full-field">
                    <SpinnerBtn loading={loading} loadingText="Saving…">
                      Save purchase
                    </SpinnerBtn>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Purchase history</h2>
                    <p className="section-sub">
                      {purchases.length} matching records
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => loadPurchases(token, filters)}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
                {renderFilters()}
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Purchase date</th>
                        <th>Base</th>
                        <th>Equipment</th>
                        <th>Quantity</th>
                        <th>Created by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((x) => (
                        <tr key={x.id}>
                          <td className="cell-id">#{x.id}</td>
                          <td className="cell-muted">
                            {String(x.purchaseDate).slice(0, 10)}
                          </td>
                          <td>{x.baseName}</td>
                          <td>{x.equipmentName}</td>
                          <td>
                            <strong>{x.quantity}</strong>
                          </td>
                          <td className="cell-muted">{x.createdBy}</td>
                        </tr>
                      ))}
                      {!purchases.length && (
                        <Empty>
                          {loading ? "Loading…" : "No matching purchases."}
                        </Empty>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ============ TRANSFERS ============ */}
          {page === "transfers" && (
            <>
              <Hero meta={meta.hero} symbol={<Icon.Transfers />} />

              <section className="panel form-card">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Record a transfer</h2>
                    <p className="section-sub">
                      The server validates stock before saving.
                    </p>
                  </div>
                </div>
                <form className="form-grid" onSubmit={submitTransfer}>
                  <Field label="From base" id="t-from">
                    <select
                      id="t-from"
                      value={transferForm.fromBaseId}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          fromBaseId: e.target.value,
                        })
                      }
                      required
                    >
                      {BASES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="To base" id="t-to">
                    <select
                      id="t-to"
                      value={transferForm.toBaseId}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          toBaseId: e.target.value,
                        })
                      }
                      required
                    >
                      {BASES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Equipment type" id="t-eq">
                    <select
                      id="t-eq"
                      value={transferForm.equipmentTypeId}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          equipmentTypeId: e.target.value,
                        })
                      }
                      required
                    >
                      {EQUIPMENT.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity" id="t-qty">
                    <input
                      id="t-qty"
                      type="number"
                      min="1"
                      step="1"
                      value={transferForm.quantity}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          quantity: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Transfer date" id="t-date">
                    <input
                      id="t-date"
                      type="date"
                      value={transferForm.transferDate}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          transferDate: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Notes (optional)" id="t-notes">
                    <input
                      id="t-notes"
                      maxLength="500"
                      value={transferForm.notes}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Reason or reference"
                    />
                  </Field>
                  <div className="form-actions full-field">
                    <SpinnerBtn loading={loading} loadingText="Processing…">
                      Record transfer
                    </SpinnerBtn>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Transfer history</h2>
                    <p className="section-sub">
                      {transfers.length} matching records
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => loadTransfers(token, filters)}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
                {renderFilters()}
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Equipment</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Created by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((x) => (
                        <tr key={x.id}>
                          <td className="cell-id">#{x.id}</td>
                          <td className="cell-muted">
                            {String(x.transferDate).slice(0, 10)}
                          </td>
                          <td>{x.fromBaseName}</td>
                          <td>{x.toBaseName}</td>
                          <td>{x.equipmentName}</td>
                          <td>
                            <strong>{x.quantity}</strong>
                          </td>
                          <td>
                            <span className="tag">{x.status}</span>
                          </td>
                          <td className="cell-muted">{x.createdBy}</td>
                        </tr>
                      ))}
                      {!transfers.length && (
                        <Empty>
                          {loading ? "Loading…" : "No matching transfers."}
                        </Empty>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ============ ASSIGNMENTS ============ */}
          {page === "assignments" && (
            <>
              <Hero meta={meta.hero} symbol={<Icon.Assignments />} />

              <section className="panel form-card">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Assign an asset</h2>
                    <p className="section-sub">
                      Only available stock can be assigned.
                    </p>
                  </div>
                </div>
                <form className="form-grid" onSubmit={submitAssignment}>
                  <Field label="Base" id="a-base">
                    <select
                      id="a-base"
                      value={assignmentForm.baseId}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          baseId: e.target.value,
                        })
                      }
                    >
                      {BASES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Equipment" id="a-eq">
                    <select
                      id="a-eq"
                      value={assignmentForm.equipmentTypeId}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          equipmentTypeId: e.target.value,
                        })
                      }
                    >
                      {EQUIPMENT.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Personnel name" id="a-name">
                    <input
                      id="a-name"
                      maxLength="150"
                      value={assignmentForm.personnelName}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          personnelName: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Quantity" id="a-qty">
                    <input
                      id="a-qty"
                      type="number"
                      min="1"
                      step="1"
                      value={assignmentForm.quantity}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          quantity: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <div className="form-actions full-field">
                    <SpinnerBtn loading={loading} loadingText="Saving…">
                      Assign asset
                    </SpinnerBtn>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Assignment history</h2>
                    <p className="section-sub">{assignments.length} records</p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => loadAssignments(token, filters.baseId)}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Assigned</th>
                        <th>Base</th>
                        <th>Equipment</th>
                        <th>Personnel</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td className="cell-id">#{a.id}</td>
                          <td className="cell-muted">
                            {String(a.assignedAt || "").slice(0, 10)}
                          </td>
                          <td>{a.baseName}</td>
                          <td>{a.equipmentName}</td>
                          <td>{a.personnelName}</td>
                          <td>
                            <strong>{a.quantity}</strong>
                          </td>
                          <td>
                            <span className="tag">{a.status}</span>
                          </td>
                          <td>
                            {a.status === "ACTIVE" ? (
                              <button
                                className="btn btn-ghost"
                                disabled={loading}
                                onClick={() => returnAssignment(a.id)}
                              >
                                Return
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                      {!assignments.length && (
                        <Empty>
                          {loading ? "Loading…" : "No assignments found."}
                        </Empty>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ============ EXPENDITURES ============ */}
          {page === "expenditures" && (
            <>
              <Hero meta={meta.hero} symbol={<Icon.Expenditures />} />

              <section className="panel form-card">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Record an expenditure</h2>
                    <p className="section-sub">
                      Expenditures reduce available stock.
                    </p>
                  </div>
                </div>
                <form className="form-grid" onSubmit={submitExpenditure}>
                  <Field label="Base" id="e-base">
                    <select
                      id="e-base"
                      value={expenditureForm.baseId}
                      onChange={(e) =>
                        setExpenditureForm({
                          ...expenditureForm,
                          baseId: e.target.value,
                        })
                      }
                    >
                      {BASES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Equipment" id="e-eq">
                    <select
                      id="e-eq"
                      value={expenditureForm.equipmentTypeId}
                      onChange={(e) =>
                        setExpenditureForm({
                          ...expenditureForm,
                          equipmentTypeId: e.target.value,
                        })
                      }
                    >
                      {EQUIPMENT.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity" id="e-qty">
                    <input
                      id="e-qty"
                      type="number"
                      min="1"
                      step="1"
                      value={expenditureForm.quantity}
                      onChange={(e) =>
                        setExpenditureForm({
                          ...expenditureForm,
                          quantity: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Date" id="e-date">
                    <input
                      id="e-date"
                      type="date"
                      value={expenditureForm.expenditureDate}
                      onChange={(e) =>
                        setExpenditureForm({
                          ...expenditureForm,
                          expenditureDate: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <div className="field full-field">
                    <label className="field-label" htmlFor="e-reason">
                      Reason
                    </label>
                    <input
                      id="e-reason"
                      maxLength="255"
                      value={expenditureForm.reason}
                      onChange={(e) =>
                        setExpenditureForm({
                          ...expenditureForm,
                          reason: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-actions full-field">
                    <SpinnerBtn loading={loading} loadingText="Saving…">
                      Record expenditure
                    </SpinnerBtn>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="section-head" style={{ margin: "0 0 6px" }}>
                  <div>
                    <h2 className="section-title">Expenditure history</h2>
                    <p className="section-sub">{expenditures.length} records</p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => loadExpenditures(token, filters)}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
                {renderFilters()}
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Base</th>
                        <th>Equipment</th>
                        <th>Qty</th>
                        <th>Reason</th>
                        <th>Created by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenditures.map((x) => (
                        <tr key={x.id}>
                          <td className="cell-id">#{x.id}</td>
                          <td className="cell-muted">
                            {String(x.expenditureDate || "").slice(0, 10)}
                          </td>
                          <td>{x.baseName}</td>
                          <td>{x.equipmentName}</td>
                          <td>
                            <strong>{x.quantity}</strong>
                          </td>
                          <td className="cell-muted">{x.reason}</td>
                          <td className="cell-muted">{x.createdBy}</td>
                        </tr>
                      ))}
                      {!expenditures.length && (
                        <Empty>
                          {loading ? "Loading…" : "No expenditures found."}
                        </Empty>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="footer">
          <span>AssetFlow · Internal Management</span>
          <span>Connected to MySQL</span>
        </footer>
      </div>

      <ToastStack toasts={toasts} setToasts={setToasts} />
    </div>
  );
}

function ToastStack({ toasts, setToasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? <Icon.Check /> : <Icon.Alert />}
          </span>
          <span>{t.message}</span>
          <button
            className="toast-close"
            onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
