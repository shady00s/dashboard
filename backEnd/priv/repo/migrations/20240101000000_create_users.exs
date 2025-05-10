defmodule BackEnd.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :serial, primary_key: true
      add :email, :string, null: false
      timestamps()
    end

    create unique_index(:users, [:email])
  end
end
