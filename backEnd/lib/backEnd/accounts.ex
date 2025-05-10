defmodule BackEnd.Accounts do
  import Ecto.Query, warn: false
  alias BackEnd.Repo
  alias BackEnd.Accounts.User

  def register_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def get_user_by_email(email) do
    Repo.get_by(User, email: email)
  end

  def authenticate_user(email, password) do
    user = get_user_by_email(email)

    if user && user.password == password do
      {:ok, user}
    else
      {:error, :invalid_credentials}
    end
  end
end
