defmodule BackEndWeb.RegistrationController do
  use BackEndWeb, :controller
  alias BackEnd.Accounts
  alias BackEnd.Accounts.User

  def create(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        conn
        |> put_status(:created)
        |> json(%{
          status: "success",
          token: generate_token(user),
          user_id: user.id,
          user: %{id: user.id, email: user.email},
          redirectTo: "/homePage"
        })

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{status: "error", errors: translate_errors(changeset)})
    end
  end

  defp generate_token(user) do
    "user_token_#{user.id}"
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
