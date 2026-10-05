// The box and its chapters, in reading order.
import leaf from './leaf.js';
import factory from './factory.js';
import six from './six.js';
import brew from './brew.js';
import chai from './chai.js';
import india from './india.js';
import { withSlim } from '../tea.js';

export const BOX = { slug: 'teaclear', title: 'TeaClear' };
export const CHAPTERS = [leaf, factory, six, brew, chai, india].map(withSlim);
