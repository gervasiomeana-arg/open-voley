import assert from 'node:assert/strict';
import { sampleMatchData } from '../data/sampleMatch';
import { mediaCardData, mediaCardLines, mediaCardSvg } from './mediaCardData';

const match = structuredClone(sampleMatchData);
const player = match.homePlayers[0];
match.actions = [];
match.isFinished = false;
match.sets = [{ setNumber: 1, scoreHome: 12, scoreAway: 8 }];
const empty = mediaCardData(match, player);
assert.equal(empty.points, 0);
assert.equal(empty.aces, 0);
assert.equal(empty.eff, null);
assert.equal(empty.recPos, null);
assert.equal(empty.homeSets, 0, 'Leading an incomplete set is not winning a set');
assert.equal(empty.attacksWithDestination, 0);
const action = (team: 'home' | 'away', skill: any, evaluation: any, endZone?: number) => ({
  ...sampleMatchData.actions[0], id: `${team}-${skill}-${evaluation}-${Math.random()}`,
  playerNum: player.number, team, skill, evaluation, endZone, setNumber: 1,
});
match.actions = [action('home', 'A', '#', 9), action('home', 'A', '='), action('home', 'A', '/'), action('home', 'S', '#'), action('home', 'B', '#'), action('home', 'R', '='), action('away', 'A', '#', 2), action('home', 'E', '#')];
const observed = mediaCardData(match, player);
assert.equal(observed.points, 3, 'Only attack, serve and block award player points');
assert.equal(observed.attacks, 3, 'Same jersey on opposing team remains separate');
assert.equal(observed.eff, -33, 'Attack efficiency subtracts errors and blocks');
assert.equal(observed.recPos, 0, 'Zero reception positivity is not replaced');
assert.equal(observed.destinations[8].total, 1);
assert.equal(observed.destinations[1].total, 0);
assert.equal(observed.attacksWithDestination, 1);
match.sets.push({ setNumber: 2, scoreHome: 25, scoreAway: 20, winner: 'home' });
assert.equal(mediaCardData(match, player).homeSets, 1);
assert.ok(mediaCardLines(match, player, 'match_result').includes('Set 1: 12 - 8'));
assert.ok(mediaCardLines(match, player, 'pass_positivity').some(line => line.includes('0%')));
const svg = mediaCardSvg(match, { ...player, name: '<script>alert(1)</script>' }, 'top_scorer', 'story_9_16', 'clean_white', '<image href="remote"/>');
assert.match(svg, /width="1080" height="1920"/);
assert.doesNotMatch(svg, /<script>|<image/);
assert.match(svg, /&lt;script&gt;/);
assert.match(mediaCardSvg(match, player, 'match_result', 'landscape_16_9', 'deep_navy', 'Partido'), /width="1920" height="1080"/);
console.log('Media cards passed: real values, empty data, team isolation, set wins, negative efficiency, zones and escaped export.');
