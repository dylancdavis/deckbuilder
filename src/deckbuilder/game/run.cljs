(ns deckbuilder.game.run
  (:require
   [deckbuilder.utilities.counter :refer [merge-counters as-shuffled-vector]]))

(def example-run
  {:resources {:points 0}
   :cards {:draw-pile [] :hand [] :discard-pile []}
   :deck-info {:cards [] :rules-card nil}
   :data {}
   :effects []
   :outcomes []})

(defn starting-draw-pile [deck]
  (let [deck-cards (:cards deck)
        cards-to-add (get-in deck [:rules-card :deck-limits :added-cards])]
    (as-shuffled-vector
     (if (nil? cards-to-add)
       deck-cards
       (merge-counters deck-cards cards-to-add)))))

(defn move-cards [from-pile to-pile amount]
  (let [cards-to-move (take amount from-pile)]
    [(concat (drop amount from-pile) cards-to-move) (concat to-pile cards-to-move)]))

(defn make-run [deck] (let [starting-draw (starting-draw-pile deck)
                            [starting-hand remaining-draw] (move-cards starting-draw [] 5)]
                        {:resources {:points 0}
                         :cards {:draw-pile remaining-draw :hand starting-hand :board [] :discard-pile []}
                         :deck-info deck
                         :stats {:turn 1 :round 1}
                         :effects []
                         :outcomes []}))

(def card-locations [:draw-pile :hand :board :discard-pile])

(defn move-card
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

; TODO: Rewrite with update-in to avoid redeclaring other keys
(defn draw-cards
  ([run n]
   (let [drawn-cards (take n (:draw-pile run))]
     (assoc run
            :draw-pile (drop n (:draw-pile run))
            :hand (into (:hand run) drawn-cards)))
   ([run] (draw-cards run 1))))

(defn advance-turn [run]
  (let [num-cards-to-draw (get-in run [:deck-info :rules-card :run-structure :draw-amount])]
    (update-in (draw-cards run num-cards-to-draw) [:data :turn] inc)))