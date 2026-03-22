/*
 * 🎵 STL Platform - Music Player
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "../components/ThemeSwitcher";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  coverUrl: string | null;
  fileUrl: string;
  duration: number | null;
  uploadedBy: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

export default function MusicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [userRole, setUserRole] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadSongs();
    loadUserRole();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 🎧 Set up audio event listeners
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong]);

  useEffect(() => {
    // 🔊 Update audio volume
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  async function loadSongs() {
    // 📥 Load songs from API
    const res = await fetch("/api/music");
    const data = await res.json();
    if (res.ok) {
      setSongs(data.songs);
      if (data.songs.length > 0 && !currentSong) {
        setCurrentSong(data.songs[0]);
      }
    }
  }

  async function loadUserRole() {
    // 👤 Check user role for admin features
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (res.ok && data.user) {
      setUserRole(data.user.role);
    }
  }

  function playSong(song: Song) {
    // ▶️ Play selected song
    setCurrentSong(song);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play();
    }, 100);
  }

  function togglePlay() {
    // ⏯️ Toggle play/pause
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function playNext() {
    // ⏭️ Play next song in playlist
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex]);
  }

  function playPrevious() {
    // ⏮️ Play previous song in playlist
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    playSong(songs[prevIndex]);
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    // 🎯 Seek to position in track
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  }

  function formatTime(seconds: number) {
    // ⏰ Format seconds to MM:SS
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Музыкальный плеер</h1>
          <p className={styles.subtitle}>Слушайте музыку в отличном качестве</p>
          {userRole === "ADMIN" && (
            <Link href="/music/admin" className={styles.adminLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <circle cx="12" cy="12" r="2"/>
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
              </svg>
              Управление музыкой
            </Link>
          )}
        </header>

        {songs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Пока нет загруженных песен</p>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.playerSection}>
              <div className={styles.nowPlaying}>
                <div className={styles.coverArt}>
                  {currentSong?.coverUrl ? (
                    <img src={currentSong.coverUrl} alt={currentSong.title} />
                  ) : (
                    <div className={styles.coverPlaceholder}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5L21 3V16"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.songInfo}>
                  <h2 className={styles.songTitle}>
                    {currentSong?.title || "Выберите песню"}
                  </h2>
                  <p className={styles.songArtist}>
                    {currentSong?.artist || "Неизвестный исполнитель"}
                  </p>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressBar} onClick={seekTo}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  />
                </div>
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className={styles.controls}>
                <button
                  className={styles.controlButton}
                  onClick={playPrevious}
                  disabled={!currentSong}
                  title="Предыдущая"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                <button
                  className={`${styles.controlButton} ${styles.playButton}`}
                  onClick={togglePlay}
                  disabled={!currentSong}
                  title={isPlaying ? "Пауза" : "Воспроизвести"}
                >
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <button
                  className={styles.controlButton}
                  onClick={playNext}
                  disabled={!currentSong}
                  title="Следующая"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 18h2V6h-2zm-11-7l8.5-6v12z"/>
                  </svg>
                </button>
              </div>

              <div className={styles.volumeSection}>
                <span className={styles.volumeIcon}>
                  {volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                      <line x1="23" y1="9" x2="17" y2="15"/>
                      <line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className={styles.volumeSlider}
                />
              </div>
            </div>

            <div className={styles.playlistSection}>
              <h3 className={styles.playlistTitle}>Плейлист ({songs.length})</h3>
              <div className={styles.songList}>
                {songs.map((song) => (
                  <button
                    key={song.id}
                    className={`${styles.songItem} ${
                      currentSong?.id === song.id ? styles.active : ""
                    }`}
                    onClick={() => playSong(song)}
                  >
                    <div className={styles.songCover}>
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} />
                      ) : (
                        <div className={styles.songCoverPlaceholder}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.songDetails}>
                      <h4 className={styles.songItemTitle}>{song.title}</h4>
                      <p className={styles.songItemArtist}>
                        {song.artist || "Неизвестный исполнитель"}
                      </p>
                    </div>
                    <span className={styles.songDuration}>
                      {song.duration ? formatTime(song.duration) : "—"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <audio ref={audioRef} src={currentSong?.fileUrl || ""} />
      </div>
    </div>
  );
}
