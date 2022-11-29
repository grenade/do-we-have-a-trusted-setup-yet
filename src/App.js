import { Fragment, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

function App() {
  const [contributions, setContributions] = useState(false);
  const [queue, setQueue] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`https://gist.githubusercontent.com/grenade/1b874c13d611f298007b95c96d47c13f/raw/contribution.json`)
        .then(response => response.json())
        .then((contributions) => {
          fetch(`https://gist.githubusercontent.com/grenade/1b874c13d611f298007b95c96d47c13f/raw/queue.json`)
            .then(response => response.json())
            .then((queue) => {
              const lastParticipantIndex = queue.findIndex(({ participant }) => participant === contributions.slice(-1)[0].participant);
              setQueue(queue.slice(lastParticipantIndex + 1).sort((a, b) => (
                a.timestamp > b.timestamp
                  ? 1
                  : a.timestamp < b.timestamp
                    ? -1
                    : 0
              )));
            });
          setContributions(contributions);
        });
    }, (10000));
    return () => clearInterval(interval);
  });
  return (
    <Container>
      <h1>do we have a trusted setup yet?</h1>
      <ul>
        <li>
          there are {
            (!!queue)
              ? (
                  <strong>
                    {queue.length}
                  </strong>
                )
              : (
                  <Spinner size="sm" animation="border" variant="dark">
                    <span className="visually-hidden">queue lookup in progress...</span>
                  </Spinner>
                )
          } participants queuing to contribute
          {
            (!!queue && !!contributions)
              ? (
                  <ul>
                    {
                      queue.slice(0, 10).reverse().map((queued, i) => (
                        <li key={queued.timestamp}>
                          {
                            (!!queued.participant)
                              ? (
                                  <a href={`https://twitter.com/${queued.participant}`} style={{marginLeft: '0.5em'}}>
                                    {queued.participant}
                                  </a>
                                )
                              : (
                                  <span>
                                    anonymous
                                  </span>
                                )
                          } will contribute next after a {Math.floor(Math.abs((new Date()).getTime() - (new Date(queued.timestamp)).getTime()) / 36e5)} hour wait
                        </li>
                      ))
                    }
                  </ul>
                )
              : null
          }
        </li>
        <li>
          there have been {
            (!!contributions)
              ? (
                  <strong>
                    {contributions.length}
                  </strong>
                )
              : (
                  <Spinner size="sm" animation="border" variant="dark">
                    <span className="visually-hidden">contribution lookup in progress...</span>
                  </Spinner>
                )
          } validated contributions to date
          {
            (!!contributions)
              ? (
                  <ul>
                    {
                      contributions.slice(-10).reverse().map((contribution) => (
                        <li key={contribution.hash}>
                          <code>
                            <strong>{contribution.hash}</strong>
                          </code> contributed by
                          {
                            (!!contribution.participant)
                              ? (
                                  <span>
                                    <a href={`https://twitter.com/${contribution.participant}`} style={{marginLeft: '0.5em'}}>
                                      {contribution.participant}
                                    </a>
                                  </span>
                                )
                              : (
                                  <span>
                                    anonymous
                                  </span>
                                )
                          } {Math.floor(Math.abs((new Date()).getTime() - (new Date(contribution.timestamp)).getTime()) / 60000)} minutes ago
                        </li>
                      ))
                    }
                  </ul>
                )
              : null
          }
        </li>
      </ul>
      <p>
        learn more about <a href="https://docs.manta.network/docs/guides/TrustedSetup" style={{textDecoration: 'none'}}>how to take part</a>.
      </p>
    </Container>
  );
}

export default App;
