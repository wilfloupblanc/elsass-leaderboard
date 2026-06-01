import './CategoryColumn.scss'
import hypercaImg from '@/assets/hypercar.webp'
import formulaImg from '@/assets/formula.webp'
import gt3Img from '@/assets/gt3.webp'

const CATEGORY_IMAGES = {
    hypercar: hypercaImg,
    f1: formulaImg,
    gt3: gt3Img
}

const CATEGORY_LABELS = {
    hypercar: 'Hypercar',
    f1: 'Formula 1',
    gt3: 'GT3'
}

const TROPHY = {
    0: '🥇',
    1: '🥈',
    2: '🥉'
}

export const CategoryColumn = ({ category, entries }) => {
    return (
        <article className="category">
            <div className="category__header">
                <img src={CATEGORY_IMAGES[category]} alt={category} className="category__car-img" />
                <h3 className="category__title">{CATEGORY_LABELS[category]}</h3>
            </div>
            <ul className="category__list">
                {entries.map((entry, i) => (
                    <li key={entry.id} className={`category__entry ${i < 3 ? 'category__entry--podium' : ''}`}>
                        <span className="category__pos">
                            {i < 3 ? TROPHY[i] : i + 1}
                        </span>
                        <span className="category__name">{entry.name}</span>
                        <span className="category__car">{category === 'f1' ? entry.year : entry.car}</span>
                        <span className="category__time">{entry.time}</span>
                    </li>
                ))}
            </ul>
        </article>
    )
}