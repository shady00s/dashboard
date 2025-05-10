defmodule BackEnd.Repo.Migrations.FixUserIdAutoincrement do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :id, :serial, primary_key: true
    end
  end
end
