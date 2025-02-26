(ns deckbuilder.game.run
  (:require
   [deckbuilder.utilities.counter :refer [as-shuffled-vector]]
   [deckbuilder.utilities.utils :refer [move-items into-randomly]]
   [deckbuilder.game.cards :as cards]))

(def example-run
  {:resources {:points {:display "Points" :value 1}}
   :cards {:draw-pile [] :hand [] :discard-pile []}
   :deck-info {:cards [] :rules-card nil}
   :data {}
   :effects []
   :outcomes []})

(def card-locations [:draw-pile :hand :board :discard-pile])

(defn move-card-by-id
  "Move a card with `id` from its location to destination `to`."
  [run id to]
  (let [cards (:cards run)
        from (some (fn [loc] (when (some #(= (:id %) id) (get cards loc)) loc)) card-locations)
        card (some #(when (= (:id %) id) %) (get cards from))]
    (cond
      (nil? from) (throw (ex-info "Card ID not found in any location" {:id id}))
      (= from to) (throw (ex-info "Card is already in the intended destination" {:id id :to to}))
      :else (-> run
                (update-in [:cards from] (fn [loc-cards] (vec (remove #(= (:id %) id) loc-cards))))
                (update-in [:cards to] conj card)))))

(defn move-cards
  "Move `amount` cards from `from-location` to `to-location`."
  [run from-location to-location amount]
  (let [run-cards (:cards run)
        [new-from new-to] (move-items (from-location run-cards) (to-location run-cards) amount)]
    (assoc run :cards (assoc run-cards from-location (vec new-from) to-location (vec new-to)))))

(defn run-template [deck]
  {:resources {:points {:display "Points" :value 0}}
   :cards {:draw-pile [] :hand [] :board [] :discard-pile []}
   :deck-info deck
   :stats {:turn {:display "Turn" :value "0"} :round {:display "Round" :value "0"}}
   :effects []
   :outcomes []})

(defn populate-draw-pile
  "Populates a run's draw pile with cards from the deck's counter, according to the given registry."
  ([run] (populate-draw-pile run cards/registry))
  ([run registry]
   (assoc-in run [:cards :draw-pile] (map registry (-> run :deck-info :cards as-shuffled-vector)))))

(defn process-start-of-game
  "Process the game-start effects of the rules card, if any, adding cards accoding to the given registry."
  ([run] (process-start-of-game run cards/registry))
  ([run registry]
   (let [game-start-effects (get-in run [:deck-info :rules-card :effects :game-start])]
     (if (nil? game-start-effects)
       run
       (reduce (fn [run effect]
                 (let [effect-type (first effect)
                       effect-args (rest effect)]
                   (case effect-type
                     :add-cards (let [[add-location cards-to-add] effect-args
                                      cards-to-add-vec (map registry (as-shuffled-vector cards-to-add))]
                                  (update-in run [:cards add-location] #(into-randomly % cards-to-add-vec)))
                     :else run)))
               run
               game-start-effects)))))

(defn draw-first-hand
  "Move cards from the draw pile to the hand according to the rules card, and initialize the turn and round counters."
  [run]
  (let [draw-amount (get-in run [:deck-info :rules-card :turn-structure :draw-amount])
        run-with-draw-cards (move-cards run :draw-pile :hand draw-amount)]
    (assoc run-with-draw-cards
           :stats {:turn {:display "Turn" :value 1}
                   :round {:display "Round" :value 1}
                   :drawn-cards {:display "Drawn Cards" :value draw-amount}})))

(defn discard-hand
  "Move cards from the hand to the discard pile according to the rules card."
  [run]
  (let [discard-specifier (get-in run [:deck-info :rules-card :turn-structure :discard-amount])
        discard-amount (if (= :all discard-specifier) (count (get-in run [:cards :hand])) discard-specifier)]
    (move-cards run :hand :discard-pile discard-amount)))

(defn make-run [deck] (-> deck run-template populate-draw-pile process-start-of-game draw-first-hand))

; TODO: Rewrite with update-in to avoid redeclaring other keys
(defn draw-cards
  ([run n]
   (let [drawn-cards (take n (:draw-pile run))]
     (assoc run
            :draw-pile (drop n (:draw-pile run))
            :hand (into (:hand run) drawn-cards)))
   ([run] (draw-cards run 1))))

(defn advance-turn [run]
  (let [num-cards-to-draw (get-in run [:deck-info :rules-card :turn-structure :draw-amount])]
    (update-in (draw-cards run num-cards-to-draw) [:data :turn] inc)))