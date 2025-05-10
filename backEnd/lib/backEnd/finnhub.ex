defmodule BackEnd.FinnhubClient do
  @moduledoc """
  A WebSocket client for connecting to Finnhub's real-time stock API.
  """
  use WebSockex
  require Logger

  def start_link(parent_pid, url) do
    WebSockex.start_link(url, __MODULE__, %{parent_pid: parent_pid})
  end

  def subscribe(client_pid, symbol) do
    message = Jason.encode!(%{type: "subscribe", symbol: symbol})
    WebSockex.send_frame(client_pid, {:text, message})
  end

  def unsubscribe(client_pid, symbol) do
    message = Jason.encode!(%{type: "unsubscribe", symbol: symbol})
    WebSockex.send_frame(client_pid, {:text, message})
  end

  # WebSockex callbacks
  def handle_connect(_conn, state) do
    Logger.info("Connected to Finnhub WebSocket")
    {:ok, state}
  end

  def handle_frame({:text, msg}, state) do
    case Jason.decode(msg) do
      {:ok, %{"data" => data}} when is_list(data) ->
        send(state.parent_pid, {:stock_update, data})
        {:ok, state}

      {:ok, %{"type" => "ping"}} ->
        # Handle ping message if needed
        {:ok, state}

      {:ok, other_msg} ->
        Logger.debug("Received other message: #{inspect(other_msg)}")
        {:ok, state}

      {:error, error} ->
        Logger.error("Failed to decode message: #{inspect(error)}")
        {:ok, state}
    end
  end

  def handle_disconnect(%{reason: reason}, state) do
    Logger.warn("Disconnected from Finnhub: #{inspect(reason)}")
    # Attempt to reconnect after a delay
    Process.send_after(self(), :reconnect, 5000)
    {:ok, state}
  end

  def handle_info(:reconnect, %{parent_pid: parent_pid} = state) do
    Logger.info("Attempting to reconnect to Finnhub")
    {:reconnect, state}
  end

  def terminate(reason, _state) do
    Logger.warn("WebSocket client terminated: #{inspect(reason)}")
    :ok
  end
end
