import Config

# Load .env file
if File.exists?(".env") do
  File.read!(".env")
  |> String.split("\n")
  |> Enum.each(fn line ->
    if String.contains?(line, "=") do
      [key, value] = String.split(line, "=", parts: 2)
      System.put_env(String.trim(key), String.trim(value))
    end
  end)
end

# Configure your database
config :backEnd, BackEnd.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "backEnd_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
config :backEnd, BackEndWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:backEnd, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:backEnd, ~w(--watch)]}
  ]

# Watch static and templates for browser reloading.
config :backEnd, BackEndWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/backEnd_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Enable dev routes for dashboard and mailbox
config :backEnd, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime
