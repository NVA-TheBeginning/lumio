import { beforeEach, describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { LoginForm } from "@/components/login-form";

describe("Login", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("renders without crashing", () => {
    expect(() => render(<LoginForm onLoginSubmit={async () => {}} />)).not.toThrow();
  });
});
