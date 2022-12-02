import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Countdown from 'react-countdown';
import md5 from 'md5';
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  Filler,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const contributionsPerHour = (contributionCount) => {
  const elapsedHours = (Math.abs((new Date()).getTime() - (new Date('2022-11-28 16:55:26.798Z')).getTime()) / 36e5);
  return (contributionCount / elapsedHours);
};

const completionTime = (contributionCount, queueCount) => {
  const hoursToCompletion = (queueCount / contributionsPerHour(contributionCount));
  return new Date((new Date()).getTime() + (hoursToCompletion * 36e5));
};

function App() {
  const [visitor, setVisitor] = useState(false);
  const [wen, setWen] = useState(false);
  const [contributions, setContributions] = useState(false);
  const [queue, setQueue] = useState(false);
  const [chartArgs, setChartArgs] = useState(false);
  useEffect(() => {
    if (contributions) {
      const hourlyContributions = [...new Set(contributions.map((c) => c.timestamp.slice(0, 13)))].map((hour) => ({
        hour,
        count: contributions.filter((c) => c.timestamp.startsWith(hour)).length,
      })).reduce((a, x, i) => [...a, ...[{
        hour: new Intl.DateTimeFormat('default', { month: 'short', day: 'numeric', hour: 'numeric' }).format(new Date(`${x.hour}:00:00.000Z`)).toLowerCase(),
        count: (!!i) ? x.count + a[i-1].count : x.count,
      }]], []);
      setChartArgs({
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
        },
        data: {
          labels: hourlyContributions.map((x) => x.hour),
          datasets: [
            {
              label: 'contributions',
              data: hourlyContributions.map((x) => x.count),
              fill: true,
              backgroundColor: 'rgba(214, 51, 132, 0.2)',
              borderColor: '#d63384',
              borderWidth: 2,
              lineTension: 0.75,
              pointBackgroundColor: '#d63384',
              pointBorderColor: '#ffffff',
              pointHoverBackgroundColor: '#d63384',
              pointBorderWidth: 1,
              pointHoverRadius: 4,
              pointHoverBorderWidth: 15,
              pointRadius: 3,
            }
          ],
        },
      });
    }
  }, [queue, contributions]);


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
  useEffect(() => {
    if (!!visitor.handle && !!queue && !!contributions) {
      const isQueued = queue.some(({ participant }) => participant === visitor.handle);
      const hasContributed = contributions.some(({ participant }) => participant === visitor.handle);
      if (hasContributed) {
        setVisitor({ handle: visitor.handle, contribution: contributions.find(({ participant }) => participant === visitor.handle) });
      } else if (isQueued) {
        const position = queue.findIndex(({ participant }) => participant === visitor.handle);
        const slot = new Date((new Date()).getTime() + (position / contributionsPerHour(contributions.length) * 36e5));
        setVisitor({ handle: visitor.handle, position, slot });
      } else {
        setVisitor({ handle: visitor.handle });
      }
    }
  }, [visitor.handle, queue, contributions]);
  const queueLookup = (handle) => {
    const isQueued = (handle.length >= 4) && !!queue && queue.some(({ participant }) => participant === handle);
    const hasContributed = (handle.length >= 4) && !!contributions && contributions.some(({ participant }) => participant === handle);
    setVisitor((isQueued || hasContributed) ? { handle } : false);
  };
  return (
    <Container>
      {(!!chartArgs) ? <Line {...chartArgs} /> : null}
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
      <p>
        learn more about <a href="https://docs.manta.network/docs/concepts/TrustedSetup" style={{textDecoration: 'none'}}>what's going on here</a>.
      </p>
      <h2>wen my turn?</h2>
      <Form.Group className="mb-3">
        <Form.Label>enter your twitter handle to see when your contribution slot is likely to occur:</Form.Label>
        <Form.Control type="text" placeholder="twitter handle" onChange={(e) => queueLookup(e.target.value)} />
      </Form.Group>
      {
        (!!queue && !!visitor && !!visitor.handle)
          ? (
              (!!visitor.contribution)
                ? (
                    <div>
                      <p>
                        your most excellent contribution on <strong style={{color: '#d63384'}}>{
                          new Intl.DateTimeFormat('default', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(visitor.contribution.timestamp)).toLowerCase()
                        }</strong> was number <strong style={{color: '#d63384'}}>{
                          visitor.contribution.number
                        }</strong>, with hash <strong style={{color: '#d63384'}}>{
                          visitor.contribution.hash
                        }</strong>!
                      </p>
                    </div>
                  )
                : (
                    (!!visitor.position && !!visitor.slot)
                      ? (
                          <div>
                            <p>you are in queue position <strong style={{color: '#d63384'}}>{visitor.position}</strong>.</p>
                            <p>
                              your contribution slot is likely to occur in <Countdown date={visitor.slot} renderer={
                              ({ days, hours, minutes, seconds, completed }) => (
                                (!!completed)
                                  ? (
                                      <span>you are good to go!</span>
                                    )
                                  : (
                                      <strong style={{color: '#d63384'}}>
                                        {(!!days) ? (<span>{days} days, </span>) : null}
                                        {(!!hours) ? (<span>{hours} hours, </span>) : null}
                                        {(!!minutes) ? (<span>{minutes} minutes, </span>) : null}
                                        {(!!seconds) ? (<span>{seconds} seconds</span>) : null}
                                      </strong>
                                    )
                              )
                            } />, on <strong style={{color: '#d63384'}}>{new Intl.DateTimeFormat('default', { dateStyle: 'full', timeStyle: 'long' }).format(visitor.slot).toLowerCase()}</strong>
                            </p>
                            <p>
                              note that your queue position can change depending on multiple factors (like others stepping out of the queue or otherwise missing their slot).
                              this page can only provide guesswork.
                              you should rely only on the messages you see in your trusted setup client.
                            </p>
                          </div>
                        )
                      : null
                  )
            )
          : null
      }
    </Container>
  );
}

export default App;
