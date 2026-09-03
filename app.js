import {
  supabase,
  signIn,
  signOut,
  getUser,
  getDashboard,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setMonthlyBudget,
  setSavingsGoal
} from "./database.js";


const $ = id =>
  document.getElementById(id);


const loginView = $("loginView");
const appView   = $("appView");


// ============================================================
// Formatting
// ============================================================

function money(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(Number(value || 0));
}


function localDateString() {

  const d = new Date();

  const year = d.getFullYear();

  const month =
    String(d.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(d.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ============================================================
// Dashboard
// ============================================================

async function refresh() {

  const dashboard =
    await getDashboard();

  $("spent").textContent =
    money(dashboard.monthly_spent);

  $("remaining").textContent =
    money(dashboard.monthly_remaining);

  $("savings").textContent =
    money(dashboard.total_savings);

  $("budgetInput").value =
    dashboard.monthly_budget;

  $("goalInput").value =
    dashboard.savings_goal;


  const expenses =
    await getExpenses();

  renderTransactions(expenses);
}


// ============================================================
// Transactions
// ============================================================

function renderTransactions(expenses) {

  const container =
    $("transactions");

  container.innerHTML = "";


  if (!expenses.length) {

    container.innerHTML =
      "<p>No expenses this month.</p>";

    return;
  }


  for (const expense of expenses) {

    const div =
      document.createElement("div");

    div.className =
      "transaction";


    const info =
      document.createElement("div");

    info.innerHTML = `
      <div class="transaction-title">
        ${expense.category}
      </div>

      <div class="transaction-description">
        ${expense.transaction_date}
        ${expense.description
          ? " · " + expense.description
          : ""}
      </div>
    `;


    const right =
      document.createElement("div");

    right.innerHTML = `
      <div class="transaction-amount">
        ${money(expense.amount)}
      </div>

      <div class="transaction-actions">

        <button class="edit">
          Edit
        </button>

        <button class="delete">
          Delete
        </button>

      </div>
    `;


    right
      .querySelector(".delete")
      .onclick =
        async () => {

          if (
            !confirm(
              "Delete this expense?"
            )
          )
            return;

          await deleteExpense(
            expense.id
          );

          await refresh();
        };


    right
      .querySelector(".edit")
      .onclick =
        async () => {

          const value =
            prompt(
              "New amount:",
              expense.amount
            );

          if (value === null)
            return;

          const amount =
            Number(value);

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {

            alert("Invalid amount");
            return;
          }

          await updateExpense(
            expense.id,
            {
              amount
            }
          );

          await refresh();
        };


    div.append(
      info,
      right
    );

    container.append(div);
  }
}


// ============================================================
// Login
// ============================================================

$("loginButton").onclick =
  async () => {

    $("loginError").textContent = "";

    const email =
      $("email").value;

    const password =
      $("password").value;


    const { error } =
      await signIn(
        email,
        password
      );


    if (error) {

      $("loginError").textContent =
        error.message;

      return;
    }


    await showApp();
  };


$("logoutButton").onclick =
  async () => {

    await signOut();

    appView.hidden = true;
    loginView.hidden = false;
  };


// ============================================================
// Add Expense
// ============================================================

$("addExpenseButton").onclick =
  async () => {

    const amount =
      Number(
        $("amountInput").value
      );


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      alert(
        "Please enter a valid amount."
      );

      return;
    }


    await addExpense({

      amount,

      category:
        $("categoryInput").value,

      description:
        $("descriptionInput").value,

      date:
        $("dateInput").value
    });


    $("amountInput").value = "";
    $("descriptionInput").value = "";

    await refresh();
  };


// ============================================================
// Budget
// ============================================================

$("saveBudget").onclick =
  async () => {

    const value =
      Number(
        $("budgetInput").value
      );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {

      alert("Invalid budget");
      return;
    }

    await setMonthlyBudget(value);

    await refresh();
  };


// ============================================================
// Savings Goal
// ============================================================

$("saveGoal").onclick =
  async () => {

    const value =
      Number(
        $("goalInput").value
      );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {

      alert(
        "Invalid savings goal"
      );

      return;
    }

    await setSavingsGoal(value);

    await refresh();
  };


// ============================================================
// Start App
// ============================================================

async function showApp() {

  loginView.hidden = true;
  appView.hidden = false;


  $("monthName").textContent =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    ).format(new Date());


  $("dateInput").value =
    localDateString();


  try {

    await refresh();

  } catch (error) {

    console.error(error);

    alert(
      "Database error: " +
      error.message
    );
  }
}


async function initialize() {

  const user =
    await getUser();

  if (user)
    await showApp();
  else {
    loginView.hidden = false;
    appView.hidden = true;
  }
}


initialize();