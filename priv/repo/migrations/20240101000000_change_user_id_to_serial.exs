defmodule BackEnd.Repo.Migrations.ChangeUserIdToSerial do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove :id
      add :id, :serial, primary_key: true
    end
  end
end
