import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Editor } from './editor';
import axios from 'axios'


test('renders text input', () => {
    const { getByTitle } = render(<Editor />);
    const textInputElement = getByTitle("Text Input")
    expect(textInputElement).toBeInTheDocument();
});

test('renders text output', () => {
    const { getByRole } = render(<Editor />);
    const textOutputElement = getByRole("contentinfo");
    expect(textOutputElement).toBeInTheDocument();
});

test('can process Name method for Symbol', async () => {
    const symbol = 'BTC'
    const resp = {
        currencies: [
            {
                "id": "btc-bitcoin",
                "is_active": true,
                "is_new": false,
                "name": "Bitcoin",
                "rank": 1,
                "rev": 10557311,
                "symbol": "BTC",
                "type": "coin"
            }
        ]
    }
    const url = `https://api.coinpaprika.com/v1/search?c=currencies&&modifier=symbol_search&&q=${symbol}`

    const mockedGet = jest
        .spyOn(axios, "get")
        .mockImplementation(() => Promise.resolve({ data: resp }));

    const { getByRole, getByTitle } = render(<Editor />);
    const textOutputElement = getByRole("contentinfo");
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ Name/${symbol} }}` } })

    await waitFor(() => {
        expect(mockedGet).toBeCalledWith(url)
        expect(mockedGet).toHaveBeenCalledTimes(1)
        expect(textOutputElement).toHaveTextContent("Bitcoin")
    })
});

test('can process Price method for Symbol', async () => {
    const symbol = 'BTC'
    const coinId = 'btc-bitcoin'
    const formatedPrice = '$57427.40'
    const coinResponse = {
        currencies: [
            {
                "id": "btc-bitcoin",
                "is_active": true,
                "is_new": false,
                "name": "Bitcoin",
                "rank": 1,
                "rev": 10557311,
                "symbol": "BTC",
                "type": "coin"
            }
        ]
    }
    const coinPriceResponse = [{
        "close": 57427.403501891175,
        "high": 58876.69551541853,
        "low": 57039.14453236207,
        "market_cap": 1111575820239,
        "open": 58876.69551541853,
        "time_close": "2021-11-22T11:08:00Z",
        "time_open": "2021-11-22T00:00:00Z",
        "volume": 35982382254,
    }]
    const coinUrl = `https://api.coinpaprika.com/v1/search?c=currencies&&modifier=symbol_search&&q=${symbol}`
    const priceUrl = `https://api.coinpaprika.com/v1/coins/${coinId}/ohlcv/today`

    const mockedGet = jest
        .spyOn(axios, "get")
        .mockImplementation((url) => {
            switch (url) {
                case coinUrl:
                    return Promise.resolve({ data: coinResponse })
                case priceUrl:
                    return Promise.resolve({ data: coinPriceResponse })
                default:
                    return Promise.reject()
            }
        });

    const { getByRole, getByTitle } = render(<Editor />);
    const textOutputElement = getByRole("contentinfo");
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ Price/${symbol} }}` } })

    await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith(coinUrl)
        expect(mockedGet).toHaveBeenCalledWith(priceUrl)
        expect(mockedGet).toHaveBeenCalledTimes(2)
        expect(textOutputElement).toHaveTextContent(formatedPrice)
    })
});

test('should output marker with error styling when given symbol was not found', async () => {
    const symbol = 'BTC'
    const resp = {
        currencies: []
    }
    const url = `https://api.coinpaprika.com/v1/search?c=currencies&&modifier=symbol_search&&q=${symbol}`

    const mockedGet = jest
        .spyOn(axios, "get")
        .mockImplementation(() => Promise.resolve({ data: resp }));

    const { getByRole, getByTitle } = render(<Editor />);
    const textOutputElement = getByRole("contentinfo");
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ Name/${symbol} }}` } })

    await waitFor(() => {
        const invalidSymbol = getByTitle("Invalid bitcoin symbol: BTC")
        expect(mockedGet).toHaveBeenCalledWith(url)
        expect(mockedGet).toHaveBeenCalledTimes(1)
        expect(invalidSymbol).toBeDefined()
        expect(textOutputElement).toHaveTextContent("{{ Name/BTC }}")
    })
});

test('should output marker with error styling when user enters method name that is not supported', async () => {
    const symbol = 'BTC'
    const usnuportedMethodName = 'Unsupported'
    const { getByRole, getByTitle } = render(<Editor />);
    const textOutputElement = getByRole("contentinfo");
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ ${usnuportedMethodName}/${symbol} }}` } })

    await waitFor(() => {
        const invalidMethod = getByTitle(`Invalid method: ${usnuportedMethodName}`)
        expect(invalidMethod).toBeDefined()
        expect(textOutputElement).toHaveTextContent(`{{ Unsupported/${symbol} }}`)
    })
});

test('should not call Api when user enters unsupported method name', async () => {
    const symbol = 'BTC'
    const usnuportedMethodName = 'Unsupported'
    const mockedGet = jest
        .spyOn(axios, "get")
        .mockImplementation(() => Promise.resolve({ data: [] }));

    const { getByTitle } = render(<Editor />);
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ ${usnuportedMethodName}/${symbol} }}` } })

    await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledTimes(0)
    })
});

test('should display error message when user enters unsupported method name', async () => {
    const symbol = 'BTC'
    const usnuportedMethodName = 'Unsupported'
    const { getByTitle } = render(<Editor />);
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ ${usnuportedMethodName}/${symbol} }}` } })

    await waitFor(() => {
        expect(getByTitle("Error message")).toBeInTheDocument()
    })
});

test('should display error message when symbol was not found', async () => {
    const symbol = 'BTC'
    const mockedGet = jest
        .spyOn(axios, "get")
        .mockImplementation(() => Promise.resolve({ data: [] }));

    const { getByTitle } = render(<Editor />);
    const textInputElement = getByTitle("Text Input")

    fireEvent.change(textInputElement, { target: { value: `{{ Name/${symbol} }}` } })

    await waitFor(() => {
        expect(getByTitle("Error message")).toBeInTheDocument()
        expect(mockedGet).toHaveBeenCalledTimes(1)
    })
});
