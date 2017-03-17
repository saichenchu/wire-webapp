/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

'use strict';

(function() {
  window.z = window.z || {};
  window.z.audio = z.audio || {};

  const AUDIO_PATH = '/audio';

  window.z.audio.AudioRepository = class AudioRepository {
    constructor() {
      this.logger = new z.util.Logger('z.audio.AudioRepository', z.config.LOGGER.OPTIONS);
      this.audio_elements = {};
      this.currently_looping = {};
      this.audio_preference = ko.observable(z.audio.AudioPreference.ALL);
      this.audio_preference.subscribe((audio_preference) => {
        if (audio_preference === z.audio.AudioPreference.NONE) {
          return this._stop_all();
        }
      });
      this._subscribe_to_audio_properties();
    }

    /**
     * Initialize the repository.
     * @param {boolean} pre_load - Should sounds be pre-loaded with false as default
     */
    init(pre_load = false) {
      this._init_sounds();
      this._subscribe_to_audio_events();
      if (pre_load) {
        this._preload();
      }
    }

    /**
     * Start playback of a sound in a loop.
     * @note Prevent playing multiples instances of looping sounds
     * @param {z.audio.AudioType} audio_id - Sound identifier
     */
    loop(audio_id) {
      this.play(audio_id, true);
    }

    /**
     * Start playback of a sound.
     * @param {z.audio.AudioType} audio_id - Sound identifier
     * @param {boolean} play_in_loop - Play sound in loop
     */
    play(audio_id, play_in_loop = false) {
      this._check_sound_setting(audio_id).then(() => {
        return this._get_sound_by_id(audio_id);
      }).then((audio_element) => {
        return this._play(audio_id, audio_element, play_in_loop);
      }).then((audio_element) => {
        return this.logger.info(`Playing sound '${audio_id}' (loop: '${play_in_loop}')`, audio_element);
      }).catch((error) => {
        if (!error instanceof z.audio.AudioError) {
          this.logger.error(`Failed playing sound '${audio_id}': ${error.message}`);
          throw error;
        }
      });
    }

    /**
     * Stop playback of a sound.
     * @param {z.audio.AudioType} audio_id - Sound identifier
     */
    stop(audio_id) {
      this._get_sound_by_id(audio_id).then((audio_element) => {
        if (!audio_element.paused) {
          this.logger.info(`Stopping sound '${audio_id}'`, audio_element);
          audio_element.pause();
        }

        if (this.currently_looping[audio_id]) {
          delete @currently_looping[audio_id];
        }
      }).catch((error) => {
        this.logger.error(`Failed stopping sound '${audio_id}': ${error.message}`, audio_element);
        throw error;
      });
    }

    /**
     * Check if sound should be played with current setting.
     * @private
     * @param {z.audio.AudioType} audio_id - Sound identifier
     * @returns {Promise} Resolves if the sound should be played.
     */
    _check_sound_setting(audio_id) {
      return new Promise((resolve, reject) => {
        if (this.audio_preference === z.audio.AudioPreference.NONE && audio_id !== z.audio.AudioPlayingType.NONE) {
          reject(new z.audio.AudioError(z.audio.AudioError.prototype.TYPE.IGNORED_SOUND));
        }
        else if (this.audio_preference === z.audio.AudioPreference.SOME && audio_id !== z.audio.AudioPlayingType.SOME) {
          reject(new z.audio.AudioError(z.audio.AudioError.prototype.IGNORED_SOUND));
        }
        else {
          resolve();
        }
      });
    }

    /**
     * Create HTMLAudioElement.
     * @private
     * @param {string} source_path - Source for HTMLAudioElement
     * @returns {Audio} Returns the audio element-
     */
    _create_audio_element(source_path) {
      const audio_element = new Audio();
      audio_element.preload = 'none';
      audio_element.src = source_path;
      return audio_element;
    }
  };
})();
