import axios from 'axios'
import * as React from 'react'
import styled from 'styled-components'
import _ from 'lodash'


interface Coin {
    id: string
    is_active: boolean
    is_new: boolean
    name: string
    rank: number
    symbol: string
    type: string
}

interface MarkersMap {
    [key: string]: string
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
`
const ErrorAlert = styled.div`
    margin: auto;
    margin-top: 20px;
    padding: 20px 10px;
    max-width: 80%;
    color: white;
    background-color: #ff3535;
`




// for (let marker of markers) {
//     const [action, symbol] = marker.split("").join("").replace("{{ ", "").replace(" }}", "").split("/")
//     console.log(action, symbol)
//     const symbolName = await getCoinName(symbol)
//     result.replaceAll(marker, "HELLO")
//     result.replace("lets", "HELLO")
//     console.log("From loop", result)
// }
// return 'jfhskjfhdsfkjsfd'

// const getCoinName = async (symbol: string): Promise<string> => {
// const { data: { currencies } } = await axios.get(`https://api.coinpaprika.com/v1/search?c=currencies&&modifier=symbol_search&&q=${symbol}`)
// const currency: Coin = currencies.find((currency: Coin) => currency.symbol === symbol)
// console.log(currency.name)
// return currency.name
// return "REPLACED"
// }


const getMarkersFromText = async (text: string): Promise<string[]> => {
    let pattern = new RegExp('{{ [a-zA-Z]+/[a-zA-Z]+ }}', 'g')
    return Array.from(new Set(text.match(pattern)))
}


// const mapCoins = (data: Coin[]) => {
//     const map = data.reduce((coins: any, coin: Coin) => {
//         coins[coin.symbol] = coin
//         return coins
//     }, {})
//     return map
// }

const fetchCoinName = async (symbol: string): Promise<string> => {
    console.log("Fetch triggered")
    const result = {
        id: 'string',
        is_active: true,
        is_new: false,
        name: 'Bitcoin',
        rank: 1,
        symbol: 'BTC',
        type: 'coin'
    }
    return result.name
}

export const Editor = () => {
    const [inputText, setInputText] = React.useState('')
    const [outputText, setOutputText] = React.useState('')
    const [errorMessage, setErrorMessage] = React.useState('')
    const [markersMap, setMarkersMap] = React.useState<MarkersMap>({})

    const handleInput = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(value)
    }

    const getMarkersData = async () => {
        const markers = await getMarkersFromText(inputText)

        let newMarkersData: MarkersMap = {}

        for (let marker of markers) {
            const [action, symbol] = marker.split("").join("").replace("{{", "").replace("}}", "").trim().split("/")
            if (!markersMap[marker]) {
                try {
                    if(action === "Name")
                        newMarkersData[marker] = await fetchCoinName(symbol)
                    if(action === "Currency")
                        newMarkersData[marker] = 'US Dollar'
                } catch (error) {
                    setErrorMessage('Sorry, there was an error while fetching coin data');
                }
            }
        }

        if (!_.isEmpty(newMarkersData)) {
            setMarkersMap({ ...markersMap, ...newMarkersData })
            newMarkersData = {}
        }
    }

    const handler = React.useCallback(_.debounce(getMarkersData, 500), [inputText])

    React.useEffect(() => {
        console.log("MARKERS MAP::", markersMap)
    }, [markersMap])

    React.useEffect(() => {
        setErrorMessage('')
        if (inputText)
            handler()
    }, [inputText])

    React.useEffect(() => {
        return handler.cancel
    }, [handler])

    return (
        <>
            <h2>Editor</h2>

            <EditorContainer>

                <EditorInput name="inputText" id="editor-input" onChange={handleInput}></EditorInput>

                <EditorOutput dangerouslySetInnerHTML={{ __html: outputText }} />

            </EditorContainer>
            {
                errorMessage && <ErrorAlert>{errorMessage}</ErrorAlert>
            }
        </>
    )
}