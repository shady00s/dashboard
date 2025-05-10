defmodule BackEnd.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      BackEndWeb.Telemetry,
      BackEnd.Repo,
      {DNSCluster, query: Application.get_env(:backEnd, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: BackEnd.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: BackEnd.Finch},
      # Start a worker by calling: BackEnd.Worker.start_link(arg)
      # {BackEnd.Worker, arg},
      # Start to serve requests, typically the last entry
      BackEndWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: BackEnd.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    BackEndWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
