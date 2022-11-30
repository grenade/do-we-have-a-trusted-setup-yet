import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Countdown from 'react-countdown';
import md5 from 'md5';
//import asdf from '@types/md5';

const contributionsPerHour = (contributionCount) => {
  const elapsedHours = (Math.abs((new Date()).getTime() - (new Date('2022-11-28 16:55:26.798Z')).getTime()) / 36e5);
  return (contributionCount / elapsedHours);
};

const completionTime = (contributionCount, queueCount) => {
  const hoursToCompletion = (queueCount / contributionsPerHour(contributionCount));
  return new Date((new Date()).getTime() + (hoursToCompletion * 36e5));
};

function App() {
  const [wen, setWen] = useState(false);
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
              let lastParticipant;
              let i = 0;
              while (!lastParticipant) {
                lastParticipant = contributions.slice(-((i+1)))[0].participant;
                i++;
              }
              const lastParticipantIndex = queue.findIndex(({ participant }) => participant === lastParticipant);
              const actualQueue = queue.slice(lastParticipantIndex + (i+1));
              setWen(completionTime(contributions.length, actualQueue.length));
              setQueue(actualQueue);
            });
          setContributions(contributions);
        });
    }, (3000));
    return () => clearInterval(interval);
  });
  return (
    <Container>
      <h1>wen trusted setup?</h1>
      <h2 style={{color: '#d63384'}}>
        {
          (!!wen)
            ? (
                <strong>
                  {new Intl.DateTimeFormat('default', { dateStyle: 'full', timeStyle: 'long' }).format(wen).toLowerCase()}
                </strong>
              )
            : (
                <Spinner size="sm" animation="border" variant="dark">
                  <span className="visually-hidden">wen trusted setup calculation in progress...</span>
                </Spinner>
              )
        }
      </h2>
      <h3>
        at the current rate of contribution validations, all queued participants will have their contributions validated in {
          (!!wen)
            ? (
                <Countdown date={wen} renderer={
                  ({ days, hours, minutes, seconds, completed }) => (
                    (!!completed)
                      ? (
                          <span>You are good to go!</span>
                        )
                      : (
                          <strong style={{color: '#d63384'}}>{days} days, {hours} hours, {minutes} minutes, {seconds} seconds</strong>
                        )
                  )
                } />
              )
            : (
                <Spinner size="sm" animation="border" variant="dark">
                  <span className="visually-hidden">wen trusted setup calculation in progress...</span>
                </Spinner>
              )
        }. 
      </h3>
      <ul>
        <li>
          <a href="https://ceremony.manta.network" style={{textDecoration: 'none'}}>
            ceremony.manta.network
          </a> is currently processing {
            (!!contributions)
              ? (
                  <strong>
                    {contributionsPerHour(contributions.length).toFixed(1)}
                  </strong>
                )
              : (
                  <Spinner size="sm" animation="border" variant="dark">
                    <span className="visually-hidden">contribution lookup in progress...</span>
                  </Spinner>
                )
          } contributions, on average, per hour.
        </li>
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
                          <code style={{color: '#000000'}}>
                            {(!!queued.participant) ? `@${md5(queued.participant)}` : 'anonymous'}
                          </code> will contribute soon after {Math.floor(Math.abs((new Date()).getTime() - (new Date(queued.timestamp)).getTime()) / 36e5)} hours in the queue
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
                          </code> contributed by <code style={{color: '#000000'}}>
                            {(!!contribution.participant) ? `@${md5(contribution.participant)}` : 'anonymous'}
                          </code> {Math.floor(Math.abs((new Date()).getTime() - (new Date(contribution.timestamp)).getTime()) / 60000)} minutes ago
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
