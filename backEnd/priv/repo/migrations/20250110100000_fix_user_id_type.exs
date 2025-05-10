defmodule BackEnd.Repo.Migrations.FixUserIdType do
  use Ecto.Migration

  def up do
    execute "DROP SEQUENCE IF EXISTS users_id_seq CASCADE"
    execute "CREATE SEQUENCE users_id_seq"
    execute "ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')"
    execute "ALTER SEQUENCE users_id_seq OWNED BY users.id"
  end

  def down do
    execute "ALTER TABLE users ALTER COLUMN id DROP DEFAULT"
    execute "DROP SEQUENCE IF EXISTS users_id_seq"
  end
end
