import * as React from 'react'
import { useCallback } from 'react'
import { Spinner } from '../ui/spinner/spinner'
import styled from 'styled-components'
import axios from 'axios'
import _ from 'lodash'
import './editor.css'


interface Coin {
    id: string
    is_active: boolean
    is_new: boolean
    name: string
    rank: number
    symbol: string
    type: string
}

interface CoinPriceData {
    time_open: string,
    time_close: string,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
    market_cap: number
}

enum SupportedMethods {
    Name = "name",
    Price = "price"
}

const EditorContainer = styled.div`
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 1fr 1fr;
`

const EditorInput = styled.textarea`
    min-height: 250px;
    width: 100%;
    resize: vertical;
`

const EditorOutput = styled.div`
    text-align: start;
    max-width: 100%;
    line-height: 1.8rem;
`
const ErrorAlert = styled.div`
    margin: auto;
    margin-top: 20px;
    padding: 20px 10px;
    max-width: 80%;
    color: white;
    text-align: center;
    background-color: #ff3535;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

const getMarkersFromText = async (text: string): Promise<string[]> => {
    let pattern = new RegExp('{{ [a-zA-Z]+/[a-zA-Z]+ }}', 'g')
    return Array.from(new Set(text.match(pattern)))
}

const fetchCoin = async (symbol: string): Promise<Coin> => {
    const { data: { currencies } } = await axios.get(`https://api.coinpaprika.com/v1/search?c=currencies&&modifier=symbol_search&&q=${symbol}`)
    const coin: Coin = currencies.find((coin: Coin) => coin.symbol === symbol)
    return coin
}

const fetchCoinName = async (symbol: string): Promise<string> => {
    const coin = await fetchCoin(symbol)
    return coin?.name ?? `<span class="invalid-name" title="Invalid bitcoin symbol: ${symbol}">{{ Name/${symbol} }}</span>`
}

const fetchCoinPrice = async (symbol: string): Promise<string> => {
    const coin = await fetchCoin(symbol)
    if (!coin) return `<span class="invalid-name" title="Invalid bitcoin symbol: ${symbol}" >{{ Price/${symbol} }}</span>`
    const { data } = await axios.get<CoinPriceData[]>(`https://api.coinpaprika.com/v1/coins/${coin.id}/ohlcv/today`)
    return `$${data[0]?.close.toFixed(2)}`
}

const parseText = (inputText: string, markersMap: Record<string, string>) => {
    if (!_.isEmpty(markersMap) && inputText) {
        let regex = new RegExp(Object.keys(markersMap).join("|"), "gi")
        let text = inputText.replace(regex, function (matched) {
            return markersMap[matched]
        })
        return text
    }
    return inputText
}

export const Editor = () => {
    const [loading, setLoading] = React.useState(false)
    const [inputText, setInputText] = React.useState('')
    const [outputText, setOutputText] = React.useState('')
    const [errorMessage, setErrorMessage] = React.useState('')
    const [markersMap, setMarkersMap] = React.useState<Record<string, string>>({})

    const handleInputParse = useCallback(
        async () => {
            const markers = await getMarkersFromText(inputText)

            let newMarkersData: Record<string, string> = {}

            for (let marker of markers) {
                const [action, symbol] = marker.replace("{{", "").replace("}}", "").trim().split("/")
                if (!markersMap[marker]) {
                    setLoading(true)
                    try {
                        if (action.toLowerCase() === SupportedMethods.Name) {
                            newMarkersData[marker] = await fetchCoinName(symbol)
                        }
                        else if (action.toLowerCase() === SupportedMethods.Price) {
                            newMarkersData[marker] = await fetchCoinPrice(symbol)
                        } else {
                            newMarkersData[marker] = `<span class="invalid-method" title="Invalid method: ${action}">${marker}</span>`
                            setErrorMessage('You have some errors in your markup.')
                        }
                    } catch (error) {
                        setErrorMessage('Sorry, there was an error while fetching coin data');
                    }
                    finally {
                        setLoading(false)
                    }
                }
            }

            if (!_.isEmpty(newMarkersData)) {
                setMarkersMap({ ...markersMap, ...newMarkersData })
                newMarkersData = {}
            }
        },
        [inputText, markersMap]
    )

    const handler = React.useCallback(_.debounce(handleInputParse, 500), [inputText])

    const handleInputChange = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(value)
    }

    React.useEffect(() => {
        setErrorMessage('')
        if (inputText) {
            handler()
        }
    }, [inputText, handler])

    React.useEffect(() => {
        setOutputText(parseText(inputText, markersMap))
    }, [inputText, markersMap])

    React.useEffect(() => {
        return handler.cancel
    }, [handler])

    return (
        <>
            <h2>Editor</h2>

            <EditorContainer>

                <EditorInput title="Text Input" name="inputText" id="editor-input" onChange={handleInputChange}></EditorInput>

                <EditorOutput role="contentinfo" aria-label="Text output" dangerouslySetInnerHTML={{ __html: outputText }} />

            </EditorContainer>

            <Container>
                {
                    loading && <Spinner />
                }
                {
                    !loading && errorMessage ? <ErrorAlert title="Error message" aria-label="Error message">{errorMessage}</ErrorAlert> : null
                }
            </Container>

        </>
    )
}