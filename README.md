A hacky tool that flattens your ERC721 or Enjin metadata to be IMX compatible. WOW!

No formatting here, I know, shocker, especially since this definitely WASN'T scraped together in minutes.
Also, I did follow best Node.js practices, which means I used a module that could've been avoided and it has brought a dozen other dependencies, because why the fuck not.

Is this code efficient - most likely not.

Does it look pretty - it's in the eyes of the beholder.

Are there gonna be bugs - ???.

Redundancy - yessir.

Hotel - **Trivago!**

Configuration:

    --input=[DIR] (default: ./metadata)

    --output=[DIR] (default: ./converted_metadata)

    --standard=[default|opensea|os|erc721, enjin|erc1155] (default: OpenSea ERC721)
    
    --debug (default: false) - shows JSON parsing error, yup that's it

    --no-extension (default: false) - removes *any* file extensions, best used when hosting on IPFS (eg. "123.json" becomes "123")

    --allow-object (default: false) - enables top-level objects, otherwise they get skipped (properties object still gets flattened)

    --allow-array (default: false) - allow-object but for arrays only, crazy, I know (attributes still get flattened)

    --allow-extra (default: false) - allows extra top level objects/arrays, used in combination with the above 2 config params

    --allow-multi (default: false) - parses multi-token metadata files
    
    --separate-multi (default: false) - separates multi-token metadata (1 file per token)


Example call:

    node index.js --standard=enjin --input=./input --allow-object --allow-extra
