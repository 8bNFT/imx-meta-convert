// IMPORTS
const fs = require('fs')
const fg = require('fast-glob');

// ARGUMENTS
const {argv: ARGS} = process
ARGS.splice(0, 1)

// ENUM
const STANDARDS = {
    DEFAULT: 0,
    ERC721: 0,
    OPENSEA: 0,
    OS: 0,
    ENJIN: 1,
    ERC1155: 1
}

// DEFAULT CONFIG
const CONFIG = {
    standard: 0,
    input: './metadata',
    output: './converted_metadata',
    allow_array: false,
    allow_object: false,
    allow_extra: false,
    debug: false,
    multi: false,
    merge_multi: true
}

// PARSING ARGUMENTS FOR CONFIG CHANGES
for(let arg of ARGS){
    let p = arg.toLowerCase().split('=')
    if(p.length === 1){
        switch(p[0]){
            case '--allow-object':{
                CONFIG.allow_object = true
                break;
            }
            case '--allow-array':{
                CONFIG.allow_array = true
                break;
            }
            case '--allow-extra':{
                CONFIG.allow_extra = true
                break;
            }
            case '--debug':{
                CONFIG.debug = true
                break;
            }
            case '--allow-multi':{
                CONFIG.multi = true
                break;
            }
            case '--separate-multi':{
                CONFIG.merge_multi = false       
                break;
            }
        }
        continue;
    }
    switch(p[0]){
        case '--standard':{
            if(Object.keys(STANDARDS).includes(p[1].toUpperCase())){
                CONFIG.standard = STANDARDS[p[1].toUpperCase()]
            }
            break;
        }
        case '--input':{
            CONFIG.input = p[1]
            break;
        }
        case '--output':{
            CONFIG.output = p[1]
            break;
        }
    }
}

function parseJSON({path}){
    try{
        return JSON.parse(fs.readFileSync(path).toString())
    }catch(err){
        if(CONFIG.debug) console.error('[JSON:ERROR]', err)
        return false
    }
}

function flattenEnjinAttributes({data}){
    const FLAT = {}
    for(let [attr, v] of Object.entries(data)){
        if(Array.isArray(v)){
            if(!CONFIG.allow_array) continue
            FLAT[attr] = v
            continue
        }

        if(typeof v !== 'object'){
            FLAT[attr] = v
            continue
        }

        if(typeof v.value === "object"){
            if(Array.isArray(v.value)){
                if(!CONFIG.allow_array) continue
            } else if(!CONFIG.allow_object) {
                continue
            }
        }

        FLAT[v.name ? v.name.toLowerCase() : attr] = v.value
    }
    return FLAT
}

function flattenOSAttributes({data}){
    const FLAT = {}
    for(let [_i, attribute] of data.entries()){
        if(typeof attribute.value === "object"){
            if(Array.isArray(attribute.value)){
                if(!CONFIG.allow_array) continue
            } else {
                if(!CONFIG.allow_object) continue
            }
        }

        FLAT[attribute.trait_type ? attribute.trait_type.toLowerCase() : (attribute.layer?.toLowerCase() || `attr_${_i}`)] = attribute.value ? attribute.value : (attribute.name || null)
    }
    return FLAT
}

function flattenJSON({data}){
    let FLAT = {}
    delete data.compiler
    for(let [k, v] of Object.entries(data)){
        if(typeof v !== 'object'){ 
            FLAT[k] = v
            continue
        }

        if(CONFIG.standard == 0){
            if(!Array.isArray(v)){
                if(!CONFIG.allow_object || !CONFIG.allow_extra) continue
                FLAT[k] = v
                continue
            }
            if(k.toLowerCase() !== 'attributes'){
                if(!CONFIG.allow_array || !CONFIG.allow_extra) continue
                FLAT[k] = v
                continue
            }
            FLAT = {...FLAT, ...flattenOSAttributes({data: v})}
        }else{
            if(Array.isArray(v)){
                if(!CONFIG.allow_array || !CONFIG.allow_extra) continue
                FLAT[k] = v
                continue
            }
            if(k.toLowerCase() !== 'properties'){
                if(!CONFIG.allow_object || !CONFIG.allow_extra) continue
                FLAT[k] = v
                continue
            }
            FLAT = {...FLAT, ...flattenEnjinAttributes({data: v})}
        }
    }
    return FLAT
}

function convert({name, path, index, length}){
    let json = parseJSON({path})
    if(!json){
        return console.error(`[FILE:PARSE] ${!isNaN(index) ? ('[' + index + (!isNaN(length) ? '/' + length : '')) + '] ' : ''}Error parsing file: ${path}`)
    }
    if(Array.isArray(json)){
        if(!CONFIG.multi) return console.error(`[FILE:PARSE] ${!isNaN(index) ? ('[' + index + (!isNaN(length) ? '/' + length : '')) + '] ' : ''}Multi-token metadata file not allowed: ${path}. Run with flag --allow-multi to parse multi-token metadata.`)
        const merged = []
        for(let [i, token] of json.entries()){
            let flattened = flattenJSON({data: token})
            if(!CONFIG.merge_multi){
                fs.writeFileSync(`${CONFIG.output}/${name}_${i+1}`, JSON.stringify(flattened, null, 4))
                console.log(`[FILE:CONVERTED] ${!isNaN(index) ? ('[' + index + (!isNaN(length) ? '/' + length : '')) + '/#' + (i + 1) + '] ' : ''}${path} to ${CONFIG.output}/${name}_${i+1}`)
            } else {
                merged.push(flattened)
            }
        }
        if(merged.length) {
            fs.writeFileSync(`${CONFIG.output}/${name}`, JSON.stringify(merged, null, 4))
            console.log(`[FILE:MERGED] ${!isNaN(index) ? ('[' + index + (!isNaN(length) ? '/' + length : '')) + '] ' : ''}${path} to ${CONFIG.output}/${name}.`)
        }
    } else {
        let flattened = flattenJSON({data: json})
        fs.writeFileSync(`${CONFIG.output}/${name}`, JSON.stringify(flattened, null, 4))
        console.log(`[FILE:CONVERTED] ${!isNaN(index) ? ('[' + index + (!isNaN(length) ? '/' + length : '')) + '] ' : ''}${path} to ${CONFIG.output}/${name}`)
    }
}

function main(){
    if(!fs.existsSync(CONFIG.output)) fs.mkdirSync(CONFIG.output)
    const files = fg.sync([`${CONFIG.input}/*`], { dot: false, followSymbolicLinks: false, onlyFiles: true, objectMode: true, deep: 0 });
    for(let [i, file] of files.entries()){
        convert({...file, index: i + 1, length: files.length})
    }
}

main()