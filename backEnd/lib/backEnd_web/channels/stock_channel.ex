defmodule BackEndWeb.StockChannel do
  use BackEndWeb, :channel
  require Logger

  @stocks ["AAPL", "GOOGL", "MSFT"]
  @finnhub_ws_url "wss://ws.finnhub.io?token=#{System.get_env("FINNHUB_API_KEY")}"

  def join("stock:all", _params, socket) do
    # Start the WebSocket client process separately
    {:ok, pid} = BackEnd.FinnhubClient.start_link(self(), @finnhub_ws_url)

    # Store the client pid in the socket assigns
    socket = assign(socket, :finnhub_client, pid)

    # Subscribe to all stocks
    Enum.each(@stocks, fn symbol ->
      BackEnd.FinnhubClient.subscribe(pid, symbol)
    end)

    {:ok, %{stocks: initial_stock_data()}, socket}
  end

  # Handle broadcast from FinnhubClient
  def handle_info({:stock_update, data}, socket) when is_list(data) do
    stocks = Enum.map(data, fn %{"s" => symbol, "p" => price, "d" => change} ->
      %{symbol: symbol, name: company_name(symbol), price: price, change: change}
    end)

    push(socket, "new_prices", %{stocks: stocks})
    {:noreply, socket}
  end

  # Fallback for other messages
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  defp initial_stock_data do
    Enum.map(@stocks, &default_stock_data/1)
  end

  defp default_stock_data(symbol) do
    %{symbol: symbol, name: company_name(symbol), price: 0.0, change: 0.0}
  end

  defp company_name("AAPL"), do: "Apple Inc."
  defp company_name("GOOGL"), do: "Alphabet Inc."
  defp company_name("MSFT"), do: "Microsoft Corporation"
  defp company_name(_), do: "Unknown Company"
end
