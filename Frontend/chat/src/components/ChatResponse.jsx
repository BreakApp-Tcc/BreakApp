const ChatResponse = ({ response }) => {
if(!response) {
    return null;
}

    const {candidates, usageMetadata } = response;

    return (
        <div className="container my-4">
            <h3>Receita:</h3>
         {candidates.map((candidate, index) => (
            <div className="card mb-3" key={index}>
                <div className="card-body">
                  <h5 className="card-title">Candidate {index +1 }</h5>
                  <p className="card-text">{candidate.content.parts[0].text}</p>
                  <h6>Citations:</h6>
                  <ul>
                    {candidate?.citationsMetadata?.citationsSources.map((source, idx) =>(
                        <li key={idx}>
                            <a href={source.url} terget="_blank" rel="noopener noreferrer">
                                {source.url}
                            </a> {" "}
                            (indexes: {source.startIndex} - {source.endIndex})
                        </li>
                    ))}
                  </ul>
                </div>
            </div>
        ))}

              <h4>Usage Metadata</h4>
              <p>Pompt Tokens: {usageMetadata.promptTokenCount}</p>
              <p>Response Tokens: {usageMetadata.candidatesTokenCount}</p>
              <p>Total Tokens: {usageMetadata.totalTokenCount}</p>
        </div>
    )
}

export default ChatResponse;