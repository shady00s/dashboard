defmodule BackEndWeb.SessionController do
  use BackEndWeb, :controller
  alias BackEnd.Accounts

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        conn
        |> put_status(:ok)
        |> json(%{status: "success", token: generate_token(user), user_id: user.id})

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{status: "error", error: "Invalid email or password"})
    end
  end

  defp generate_token(user) do
    "user_token_#{user.id}"
  end
end
