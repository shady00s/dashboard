defmodule BackEndWeb.Tracker do
  use Phoenix.Tracker

  def start_link(opts) do
    opts = Keyword.merge([name: __MODULE__], opts)
    Phoenix.Tracker.start_link(__MODULE__, opts, opts)
  end

  def init(opts) do
    server = Keyword.fetch!(opts, :pubsub_server)
    {:ok, %{pubsub_server: server}}
  end

  def handle_diff(diff, state) do
    for {topic, {joins, leaves}} <- diff do
      for {key, meta} <- joins do
        IO.puts "presence join: topic #{topic} key #{inspect key} meta #{inspect meta}"
      end
      for {key, meta} <- leaves do
        IO.puts "presence leave: topic #{topic} key #{inspect key} meta #{inspect meta}"
      end
    end
    {:ok, state}
  end
end
