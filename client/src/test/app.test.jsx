import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import useDebounce from "../hooks/useDebounce";
import useForm from "../hooks/useForm";
import { rules, validate } from "../lib/validators";
import { money } from "../lib/format";
import Login from "../pages/auth/Login";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";

describe("validators", () => {
  test("password rules", () => {
    expect(rules.password("short")).toMatch(/8 characters/);
    expect(rules.password("longpassword")).toMatch(/number/);
    expect(rules.password("Passw0rd")).toBe("");
  });

  test("validate returns first error per field", () => {
    const errors = validate({ email: "", amount: "-1" }, {
      email: [rules.required("Email"), rules.email],
      amount: [rules.positive("Amount")],
    });
    expect(errors).toEqual({ email: "Email is required", amount: "Amount must be greater than 0" });
  });
});

test("money formats rupees in Indian style", () => {
  expect(money(1234567)).toBe("₹12,34,567");
});

test("useDebounce delays updates", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: "a" } });
  rerender({ v: "ab" });
  expect(result.current).toBe("a");
  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe("ab");
  vi.useRealTimers();
});

test("useForm blocks submit when invalid", async () => {
  const onSubmit = vi.fn();
  const { result } = renderHook(() => useForm({ name: "" }, { name: [rules.required("Name")] }));
  await act(() => result.current.handleSubmit(onSubmit)());
  expect(onSubmit).not.toHaveBeenCalled();
  expect(result.current.errors.name).toBe("Name is required");
});

test("login form shows validation errors", async () => {
  render(
    <MemoryRouter>
      <ToastProvider><AuthProvider><Login /></AuthProvider></ToastProvider>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));
  expect(await screen.findByText("Email is required")).toBeInTheDocument();
  expect(screen.getByText("Password is required")).toBeInTheDocument();
});
