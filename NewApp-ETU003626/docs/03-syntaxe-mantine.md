# Mantine — les composants d'interface du projet

Mantine = la librairie UI. Tu n'écris presque jamais de CSS : tu assembles des
composants et tu règles leurs props. Doc officielle : https://mantine.dev

## 1. La mise en page : Stack, Group, Grid

```jsx
// Stack = empile VERTICALEMENT (gap = espace entre les éléments)
<Stack gap="lg">
  <Title order={2}>Titre</Title>
  <Card>...</Card>
</Stack>

// Group = aligne HORIZONTALEMENT
<Group justify="space-between">   {/* un à gauche, un à droite */}
  <Title order={4}>Salariés</Title>
  <Badge>12</Badge>
</Group>
<Group justify="flex-end">        {/* tout à droite (boutons de formulaire) */}

// Grid = colonnes (sur 12). base=mobile, md=écran moyen et plus :
<Grid>
  <Grid.Col span={{ base: 12, md: 8 }}>colonne principale</Grid.Col>
  <Grid.Col span={{ base: 12, md: 4 }}>colonne latérale</Grid.Col>
</Grid>
```

## 2. Les props raccourcies (partout dans le code)

| Prop | Signifie | Exemple |
|---|---|---|
| `mb`, `mt`, `my` | margin bottom / top / vertical | `mb="md"` |
| `maw` | largeur max | `maw={640}` |
| `c` | couleur du texte | `c="dimmed"` (gris atténué) |
| `fw` | graisse du texte | `fw={600}` (semi-gras) |
| `tt` | transformation | `tt="uppercase"` |
| `size` | taille | `size="xs"` à `"xl"` |

Les espacements acceptent `"xs" "sm" "md" "lg" "xl"` ou un nombre (pixels).

```jsx
<Text c="dimmed" size="sm" mb="md">Texte secondaire</Text>
<Title order={2}>h2</Title>    {/* order = niveau de titre 1..6 */}
```

## 3. Conteneurs : Card, Alert, Badge

```jsx
<Card withBorder padding="lg" radius="md">contenu encadré</Card>

<Alert color="orange" title="Attention">message</Alert>   // aussi: red, green, blue

<Badge color="green">Payé</Badge>
<Badge variant="light" color="gray">Comptable</Badge>
```

## 4. Champs de formulaire

Tous suivent le trio `value` / `onChange` (voir doc React §7) :

```jsx
<TextInput label="Montant" type="number" step="0.01" required
  value={amount} onChange={(e) => setAmount(e.currentTarget.value)} />

<TextInput label="Mois" type="month"
  value={month} onChange={(e) => setMonth(e.currentTarget.value)} />

{/* ⚠️ Select et FileInput donnent la VALEUR directement, pas un événement : */}
<Select label="Poste" data={['all', 'Comptable', 'Vente']}
  value={job} onChange={setJob} />

<FileInput label="CSV" accept=".csv" clearable
  value={file} onChange={setFile} />

<PasswordInput value={code} onChange={(e) => setCode(e.currentTarget.value)} />
```

`data` d'un Select : soit `['a', 'b']`, soit `[{ value: '5', label: 'Rakotobe' }]`
(value = ce qui est stocké, label = ce qui est affiché).

## 5. Boutons

```jsx
<Button type="submit" loading={saving}>Valider</Button>
<Button color="red" onClick={() => setConfirmOpen(true)}>Supprimer</Button>
<Button variant="light" disabled={selected.length === 0}>Générer</Button>
```

- `loading={bool}` → spinner + désactivé (pendant un appel réseau)
- `disabled={bool}` → grisé
- `variant` : plein par défaut, `"light"` pâle, `"outline"` contour

## 6. Table

```jsx
<Table striped highlightOnHover>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Nom</Table.Th>
      <Table.Th style={{ textAlign: 'right' }}>Montant</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {rows.map((r) => (
      <Table.Tr key={r.id}>
        <Table.Td>{r.lastname}</Table.Td>
        <Table.Td style={{ textAlign: 'right' }}>{formatAmount(r.amount)}</Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

## 7. Modal (fenêtre superposée)

```jsx
const [opened, setOpened] = useState(false);

<Button onClick={() => setOpened(true)}>Ouvrir</Button>

<Modal opened={opened} onClose={() => setOpened(false)} title="Titre" size="md">
  contenu...
</Modal>
```

`opened` pilote l'affichage ; `onClose` est appelé par la croix / clic dehors / Échap.
Voir le pattern "modale conditionnelle" dans [06-patterns-du-projet.md](06-patterns-du-projet.md).

## 8. Notifications (via notre wrapper)

N'utilise pas Mantine directement — passe par `utils/notify.js` :

```js
import { notifySuccess, notifyWarning, notifyError } from '../../utils/notify';

notifySuccess('Salaire créé.');
notifyWarning('Veuillez remplir tous les champs.');
notifyError('Échec de la création', err);   // extrait le message de l'erreur
```

## 9. Divers rencontrés dans le code

```jsx
<Loader size="xs" />                          // spinner
<Center h="70vh">centré</Center>              // centrage vertical+horizontal
<Divider my="sm" />                           // trait de séparation
<Avatar src={url} radius="xl">RK</Avatar>     // photo ou initiales
<ScrollArea>longue liste…</ScrollArea>
```

## 10. Charts (Dashboard)

```jsx
import { DonutChart, BarChart } from '@mantine/charts';

<DonutChart data={[{ name: 'Homme', value: 2170, color: 'blue.6' }]} withTooltip />

<BarChart h={300} data={byMonth} dataKey="month"     // dataKey = axe X
  series={[{ name: 'montant', color: 'blue.6' }]} /> // name = la clé à tracer
```

Le format exact des données est préparé dans `services/dashboardService.js` —
si tu veux changer un graphe, commence par regarder ce que ce service renvoie.
