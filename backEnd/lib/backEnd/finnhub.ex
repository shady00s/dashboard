defmodule BackEnd.StockPoller do
  use GenServer
  require Logger

  @interval 1_000  # 1 second
  @stocks ["AAPL", "GOOGL", "MSFT"]
  @api_key System.get_env("FINNHUB_API_KEY")

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(state) do
    schedule_fetch()
    {:ok, state}
  end

  def handle_info(:fetch, state) do
    Enum.each(@stocks, fn symbol ->
      fetch_and_broadcast(symbol)
    end)

    schedule_fetch()
    {:noreply, state}
  end

  defp schedule_fetch do
    Process.send_after(self(), :fetch, @interval)
  end

  defp fetch_and_broadcast(symbol) do
    url = "https://finnhub.io/api/v1/quote?symbol=#{symbol}&token=#{@api_key}"

    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, %{"c" => current_price, "pc" => previous_close}} ->
            change = current_price - previous_close
            data = %{
              symbol: symbol,
              name: company_name(symbol),
              price: current_price,
              change: change
            }

            BackEndWeb.Endpoint.broadcast!("stock:all", "new_price", data)

          {:error, decode_error} ->
            Logger.error("JSON decode error: #{inspect(decode_error)}")
        end

      {:ok, %HTTPoison.Response{status_code: status_code}} ->
        Logger.error("Failed to fetch #{symbol}: HTTP #{status_code}")

      {:error, error} ->
        Logger.error("HTTP request error: #{inspect(error)}")
    end
  end

  defp company_name("AAPL"), do: "Apple Inc."
  defp company_name("GOOGL"), do: "Alphabet Inc."
  defp company_name("MSFT"), do: "Microsoft Corporation"
  defp company_name(_), do: "Unknown Company"
end
