defmodule BackEndWeb.UserSocket do
  use Phoenix.Socket

  channel "stock:*", BackEndWeb.StockChannel
  channel "stocks:*", BackEndWeb.StockChannel

  @impl true
  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  @impl true
  def id(_socket), do: nil
end
