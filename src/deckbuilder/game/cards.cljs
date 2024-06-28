(ns deckbuilder.game.cards)

(def score {:name "Score"
            :description "Gain 1 Point."
            :event [:gain-resource :points 1]
            :cost 0})

(def buy-basic {:name "Buy Basic"
                :description "Buy a Basic Card."
                :event [:buy-basic]
                :cost 2})

(def basic-rules {:name "Starter Rules"
                  :type :rules
                  :deck-limits {:size 0 :added-cards {score 7 buy-basic 1}}
                  :run-structure {:draw-amount 1
                                  :play-amount 1}
                  :end-conditions {:rounds 1}
                  :cost 2})

(def dual-score {:name "Dual Score"
                 :description "Gain 2 Points. Deck Limit 2."
                 :deck-limit 2
                 :event [:gain-resource :points 2]
                 :cost 4})

(def save-reward {:name "A Penny Saved"
                  :description "If you haven't purchased a card this round, gain 2 points."
                  :cost 4})

(def zero-reward {:name "Starting Surge"
                  :description "If you have 0 points, gain 6 points."
                  :cost 4})

(def point-reset {:name "Point Reboot"
                  :description "Lose all points, then gain 4 points."
                  :cost 6})

(def point-multiply {:name "Point Multiplication"
                     :description "If you have 4 or less points, double them."})

(def score-surge {:name "Score Surge"
                  :description "Gain 2 points for each \"Score\"played this round (up to 4)."
                  :cost 10})

(def score-synergy {:name "Score Synergy"
                    :description "Gain 1 point for each \"Score\" in your deck (up to 6)."
                    :cost 10})

(def borrow-points {:name "Borrowed Points"
                    :description "Gain 6 points. In 2 turns, lose 6 points (down to zero)"
                    :cost 10})

(def last-resort {:name "Last Resort"
                  :description "Gain 8 Points, then destroy this card"
                  :cost 12})

(def cards
  {::score score
   ::buy-basic buy-basic
   ::basic-rules basic-rules
   ::dual-score dual-score
   ::save-reward save-reward
   ::zero-reward zero-reward
   ::point-reset point-reset
   ::point-multiply point-multiply
   ::score-surge score-surge
   ::score-synergy score-synergy
   ::borrow-points borrow-points
   ::last-resort last-resort})

(def basic-cards #{::score ::buy-basic ::basic-rules})
