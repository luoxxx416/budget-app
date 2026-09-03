import {
  SUPABASE_URL,
  SUPABASE_KEY
} from "./config.js";

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabase =
  createClient(SUPABASE_URL, SUPABASE_KEY);


// ============================================================
// Authentication
// ============================================================

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}


// ============================================================
// Dashboard
// ============================================================

export async function getDashboard() {

  const { data, error } =
    await supabase.rpc("get_dashboard");

  if (error)
    throw error;

  return data[0];
}


// ============================================================
// Expenses
// ============================================================

export async function getExpenses() {

  const user = await getUser();

  if (!user)
    throw new Error("Not logged in");

  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const start =
    `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const nextMonth =
    new Date(year, month + 1, 1);

  const end =
    `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1
    ).padStart(2, "0")}-01`;

  const { data, error } =
    await supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", start)
      .lt("transaction_date", end)
      .order("transaction_date", {
        ascending: false
      })
      .order("id", {
        ascending: false
      });

  if (error)
    throw error;

  return data;
}


export async function addExpense({
  amount,
  category,
  description,
  date
}) {

  const user = await getUser();

  if (!user)
    throw new Error("Not logged in");

  const { error } =
    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount,
        category,
        description,
        transaction_date: date
      });

  if (error)
    throw error;
}


export async function updateExpense(
  id,
  values
) {

  const { error } =
    await supabase
      .from("transactions")
      .update(values)
      .eq("id", id);

  if (error)
    throw error;
}


export async function deleteExpense(id) {

  const { error } =
    await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

  if (error)
    throw error;
}


// ============================================================
// Monthly budget
// ============================================================

export async function setMonthlyBudget(amount) {

  const user = await getUser();

  if (!user)
    throw new Error("Not logged in");

  const now = new Date();

  const month =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;

  const { error } =
    await supabase
      .from("monthly_budgets")
      .upsert(
        {
          user_id: user.id,
          month,
          budget: amount
        },
        {
          onConflict: "user_id,month"
        }
      );

  if (error)
    throw error;
}


// ============================================================
// Savings goal
// ============================================================

export async function setSavingsGoal(amount) {

  const user = await getUser();

  if (!user)
    throw new Error("Not logged in");

  const { error } =
    await supabase
      .from("settings")
      .upsert({
        user_id: user.id,
        savings_goal: amount
      });

  if (error)
    throw error;
}