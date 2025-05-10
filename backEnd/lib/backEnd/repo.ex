defmodule BackEnd.Repo do
  use Ecto.Repo,
    otp_app: :backEnd,
    adapter: Ecto.Adapters.Postgres
end
