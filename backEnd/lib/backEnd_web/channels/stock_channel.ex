defmodule BackEndWeb.StockChannel do
  use BackEndWeb, :channel
  require Logger
  alias HTTPoison
  alias Jason

  @max_connections 5
  @cooldown_ms 5000

  def join("stock:all", params, socket), do: handle_join(params, socket)
  def join("stocks:" <> stock_id, params, socket) when is_binary(stock_id) do
    handle_join(params, socket)
  end

  defp handle_join(params, socket) do
    case validate_join(params) do
      {:ok, _} ->
        if connected?(socket) do
          {:error, %{reason: "already joined"}}
        else
          Process.send_after(self(), :check_duplicate, @cooldown_ms)
          stocks = fetch_current_stocks()
          {:ok, %{stocks: stocks}, socket}
        end
      {:error, reason} ->
        {:error, %{reason: reason}}
    end
  end

  defp fetch_current_stocks() do
    Logger.info("Fetching current stocks...")
    api_key = System.get_env("FINNHUB_API_KEY")
    Logger.debug("Using FINNHUB_API_KEY: #{String.slice(api_key, 0, 4)}...")

    ["AAPL", "MSFT", "NVDA", "GOOGL", "JPM", "BAC", "V", "AMZN", "WMT", "MCD"]
    |> Enum.map(fn symbol ->
      url = "https://finnhub.io/api/v1/quote?symbol=#{symbol}&token=#{api_key}"
      Logger.debug("Fetching #{symbol} from #{String.slice(url, 0, 30)}...")

      case HTTPoison.get(url) do
        {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
          Logger.debug("Received 200 response for #{symbol}")
          case Jason.decode(body) do
            {:ok, %{"c" => current_price, "pc" => previous_close}} ->
              stock = %{
                symbol: symbol,
                name: company_name(symbol),
                price: current_price,
                change: current_price - previous_close
              }
              Logger.debug("Successfully parsed #{symbol}: #{inspect(stock)}")
              stock
            {:error, error} ->
              Logger.error("Failed to decode #{symbol} response: #{inspect(error)}")
              nil
          end
        {:ok, %HTTPoison.Response{status_code: status}} ->
          Logger.error("Failed to fetch #{symbol}: HTTP #{status}")
          nil
        {:error, error} ->
          Logger.error("HTTP error for #{symbol}: #{inspect(error)}")
          nil
      end
    end)
    |> Enum.filter(& &1)
    |> tap(fn stocks ->
      Logger.info("Fetched #{length(stocks)} stocks")
      Logger.debug("Stocks: #{inspect(stocks)}")
    end)
  end

  defp company_name("AAPL"), do: "Apple Inc."
  defp company_name("MSFT"), do: "Microsoft Corporation"
  defp company_name("NVDA"), do: "NVIDIA Corporation"
  defp company_name("GOOGL"), do: "Alphabet Inc."
  defp company_name("JPM"), do: "JPMorgan Chase & Co."
  defp company_name("BAC"), do: "Bank of America Corporation"
  defp company_name("V"), do: "Visa Inc."
  defp company_name("AMZN"), do: "Amazon.com Inc."
  defp company_name("WMT"), do: "Walmart Inc."
  defp company_name("MCD"), do: "McDonald's Corporation"
  defp company_name(_), do: "Unknown Company"

  def handle_info(:check_duplicate, socket) do
    if duplicate_connection?(socket) do
      {:stop, :normal, socket}
    else
      {:noreply, socket}
    end
  end

  def handle_info(%{event: "new_price", payload: data}, socket) do
    push(socket, "new_price", data)
    {:noreply, socket}
  end

  defp validate_join(params) do
    case params do
      %{"user_id" => user_id} when is_binary(user_id) -> {:ok, user_id}
      %{} -> {:error, "Missing required parameters. Expected: %{\"user_id\" => \"user_id\"}"}
      _ -> {:error, "Invalid parameters. Expected: %{\"user_id\" => \"user_id\"}"}
    end
  end

  defp connected?(socket) do
    user_id = socket.assigns[:user_id]
    case Phoenix.Tracker.list(BackEndWeb.Tracker, "stock:all") do
      {:ok, list} ->
        Enum.any?(list, fn {_pid, meta} -> meta[:user_id] == user_id end)
      _ -> false
    end
  end

  defp duplicate_connection?(socket) do
    user_id = socket.assigns[:user_id]
    case Phoenix.Tracker.list(BackEndWeb.Tracker, "stock:all") do
      {:ok, list} ->
        Enum.count(list) >= @max_connections ||
        Enum.any?(list, fn {_pid, meta} -> meta[:user_id] == user_id end)
      _ -> false
    end
  end
end
