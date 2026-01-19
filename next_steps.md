- 6 issues vyřeš
  - ## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
  {id: ..., name: "Gaming", budgetCap: Decimal, isActive: ..., createdAt: ..., updatedAt: ...}
                                       ^^^^^^^


    at stringify (<anonymous>:1:18)
    at UsersPage (app\dashboard\users\page.tsx:29:7)

## Code Frame
  27 |       </div>
  28 |
> 29 |       <UserManagement initialUsers={users} sections={sections} />
     |       ^
  30 |     </div>
  31 |   )
  32 | }

Next.js version: 16.1.3 (Turbopack)

- ## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
  {id: ..., name: "HR", budgetCap: Decimal, isActive: ..., createdAt: ..., updatedAt: ...}
                                   ^^^^^^^


    at stringify (<anonymous>:1:18)
    at UsersPage (app\dashboard\users\page.tsx:29:7)

## Code Frame
  27 |       </div>
  28 |
> 29 |       <UserManagement initialUsers={users} sections={sections} />
     |       ^
  30 |     </div>
  31 |   )
  32 | }

Next.js version: 16.1.3 (Turbopack)

- ## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
  {id: ..., name: ..., budgetCap: Decimal, isActive: ..., createdAt: ..., updatedAt: ...}
                                  ^^^^^^^


    at stringify (<anonymous>:1:18)
    at UsersPage (app\dashboard\users\page.tsx:29:7)

## Code Frame
  27 |       </div>
  28 |
> 29 |       <UserManagement initialUsers={users} sections={sections} />
     |       ^
  30 |     </div>
  31 |   )
  32 | }

Next.js version: 16.1.3 (Turbopack)

- ## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
  {id: ..., name: "PR", budgetCap: Decimal, isActive: ..., createdAt: ..., updatedAt: ...}
                                   ^^^^^^^


    at stringify (<anonymous>:1:18)
    at UsersPage (app\dashboard\users\page.tsx:29:7)

## Code Frame
  27 |       </div>
  28 |
> 29 |       <UserManagement initialUsers={users} sections={sections} />
     |       ^
  30 |     </div>
  31 |   )
  32 | }

Next.js version: 16.1.3 (Turbopack)

- ## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
  {id: ..., name: "vedení", budgetCap: Decimal, isActive: ..., createdAt: ..., updatedAt: ...}
                                       ^^^^^^^


    at stringify (<anonymous>:1:18)
    at UsersPage (app\dashboard\users\page.tsx:29:7)

## Code Frame
  27 |       </div>
  28 |
> 29 |       <UserManagement initialUsers={users} sections={sections} />
     |       ^
  30 |     </div>
  31 |   )
  32 | }

Next.js version: 16.1.3 (Turbopack)


- uživateli se zobrazují tlačíka schavalit; nechci, uživatel má mit možnost pouze nahrát že jo.
  - ještě jednou celý koncept - normánlní člen nahraje žádost (vyplňuje účel, odhadovanou částku a odhadované datum nákupu), následně mu admin žádost schválí, poté uživatel nahraje obrázek reálné učtenky, realné datum a realnou částku, tato učtenka je nasledně ověřena adminem. člen vidí pouze svoje žádosti a učtenky, nemůže schvalovat a ověřovat. Vedoucí sekce vidí všechny účtenky dané sekce ale nemuze nic upravovat a schvalovat. Admin schvaluje, ověřuje, vidí vše a upravuje vše. takže normální člen má k dispozici pouze dvě tlačítka - nová žádost a nahrát účtenku (zobrazí se ve správný moment)

- uživatel má možnost být ve více sekcích

- přidat rozlišení metariál služby (default materál), pouze pro admina

- v exportu POUZE - datum, sekce, ucel, obchod, castka, material/sluzba
- export chci ; separated - pro česky excel jednoudssi

- Obtázky nahrávat do blobu

- budgety nějak vymyslet na semestry
