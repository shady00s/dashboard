import Config

config :backEnd, BackEnd.Repo,
  ssl: true,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

config :backEnd, BackEndWeb.Endpoint,
  server: true,
  http: [
    port: String.to_integer(System.get_env("PORT") || "4000"),
    transport_options: [socket_opts: [:inet6]]
  ],
  url: [host: System.get_env("PHX_HOST"), port: 443]

config :hammer,
  backend: {Hammer.Backend.Redis, [
    expiry_ms: 60_000 * 60 * 4,
    redix_config: [
      host: System.get_env("REDIS_HOST") || "localhost",
      port: String.to_integer(System.get_env("REDIS_PORT") || "6379"),
      password: System.get_env("REDIS_PASSWORD")
    ]
  ]}

config :logger, level: :info
