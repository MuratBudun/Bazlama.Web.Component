import htmlContent from "./useElementText.htm"
import bazS01Html from "../sample/baz-s01.htm.txt"
import bazS01Ts from "../sample/baz-s01.ts.txt"

export default function useElementText() {
    return htmlContent.replace("{{bazS01Html}}", bazS01Html).replace("{{bazS01Ts}}", bazS01Ts)
}