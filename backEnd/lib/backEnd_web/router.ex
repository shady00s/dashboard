defmodule BackEndWeb.Router do
  use BackEndWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {BackEndWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug Plug.Parsers,
      parsers: [:json],
      pass: ["*/*"],
      json_decoder: Phoenix.json_library()
  end

  scope "/", BackEndWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/api", BackEndWeb do
    pipe_through :api

    post "/signup", RegistrationController, :create
    post "/login", SessionController, :login
  end

  if Application.compile_env(:backEnd, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: BackEndWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
