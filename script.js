class Text {
	constructor(txt) {
		this.text = txt
	}

	add(other) {
		return new Text(this.text + other.text)
	}

	bold() {
		return new Text("<b>" + this.text + "</b>")
	}

	italic() {
		return new Text("<i>" + this.text + "</i>")
	}

	underline() {
		return new Text("<u>" + this.text + "</u>")
	}
}

// From https://stackoverflow.com/a/6234804
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

const tagStart = "@"
const tagDelimiterStart = "{"
const tagDelimiterEnd = "}"
const identifierChar = "%"
const missingIdentifierPlaceholder = "???"

class ITLexer {
    setText(to) {
		this.text = this.replaceIdentifiers(to)
        this.position = 0
    }

    currentChar() {
        if (this.position >= this.text.length) {
            return null
        } else {
            return this.text[this.position]
        }
    }

    addTag(char, modifier) {
        this.tagHandlers[char] = modifier
        this.availableTags.add(char)
    }

    takeChar() {
        let result = this.currentChar()
        if (result === null) {
        	result = "?"
        }
        this.position++

        return result
    }
    
    advance(n) {
        this.position += n
    }
    
    handleTag() {
        // Takes the tag start
        let backupText = this.takeChar()
        let handlers = []
        
        let usingDelimiters = false
        
        while (this.currentChar() !== null) {
        	const char = this.currentChar()
            backupText += this.takeChar()
            const handler = this.tagHandlers[char]
            if (handler !== undefined) {
                handlers.push(handler)
            } else {
                usingDelimiters = char == tagDelimiterStart
                break
            }
        }
        
        if (handlers.length == 0) { return new Text(backupText) }
        
        let content = ""
        
        let foundEnd = false
        if (usingDelimiters) {
            while (this.currentChar() != null) {
                if (this.currentChar() == tagDelimiterEnd) {
                    foundEnd = true
                    this.takeChar()
                    break
                }
                content += this.takeChar()
            }
        } else {
            content = this.takeChar()
        }
            
        if (usingDelimiters && !foundEnd) {
            return new Text(backupText + content)
        }

        let result = new Text(content)
        for (let modifier of handlers) {
            result = modifier(result)
        }
        return result
    }
    
    isValidIdChar(char, first) {
        if (char == null) return false
        return char == "_" || (/[a-zA-Z]/).test(char) || (!first && (/[0-9]/).test(char))
    }
    
    replaceIdentifiers(text) {
        let result = text
        while(result.indexOf(identifierChar) >= 0){
        	let charPosition = result.indexOf(identifierChar)
            let iter = charPosition+1
            function charInReplacement(){
                return iter >= result.length ? null : result[iter]
            }

            let identifier = ""
            let first = true
            
            while (this.isValidIdChar(charInReplacement(), first)) {
                first = false
                identifier += charInReplacement()
                iter++
            }
            
            let value
            if (this.variables[identifier]) {
                value = "" + this.variables[identifier]
            } else {
                value = missingIdentifierPlaceholder
            }

            result = result.substr(0, charPosition) + value + result.substr(charPosition + identifier.length + 1)
        }
        
        return result
    }
    
    parse() {
        let result = new Text("")
        
        while(this.position < this.text.length) {
            if(this.currentChar() == tagStart){
                result = result.add(this.handleTag())
                continue
            }

            // Take as many characters as possible as a single Text instance
            let tagIndex = this.text.substr(this.position).indexOf(tagStart)
            if (tagIndex < 0) { tagIndex = this.text.length }
            let simpleText = this.text.substr(this.position, tagIndex)
            
            result = result.add(new Text(simpleText))
            this.advance(simpleText.length)
        }
        
        return result
    }
    
    setup(text = null, variables = null) {
        if(variables !== null){
            this.variables = variables
        }

        if(this.text !== null){
            this.setText(text)
        }
    }
    
    constructor() {
        this.position = 0
        this.setText("")

        this.tagHandlers = {}
        this.availableTags = new Set()

        this.addTag("b", (txt)=> txt.bold())
        this.addTag("i", (txt)=> txt.italic())
        this.addTag("u", (txt)=> txt.underline())
    }
}

let textInput
let textOutput
addEventListener('load', ()=>{
	textInput = document.getElementById('text-input')
	textOutput = document.getElementById('text-output')

	textInput.addEventListener('DOMSubtreeModified', ()=> {
		let result = parseText(escapeHtml(textInput.innerText))

        textOutput.innerHTML = result.text
	})
})

function parseText(txt) {
	let lexer = new ITLexer()

	lexer.setup(txt, {num_preguntas: 200})
	let result = lexer.parse()
	console.log(result)
    return result
}