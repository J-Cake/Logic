-- we don't know how to generate root <with-no-name> (class Root) :(
create table access
(
    documentId int not null,
    userId int not null,
    dateGranted date default current_timestamp,
    canEdit boolean default false not null
);

create table components
(
    componentId int default 0 not null
        constraint components_pk
            primary key,
    ownerId int not null,
    componentName text default '' not null,
    componentToken text default '' not null,
    public boolean default false not null,
    source text default '{}'
);

create unique index components_componentId_uindex
	on components (componentId);

create unique index components_componentToken_uindex
	on components (componentToken);

create table documents
(
    ownerId int not null,
    documentId int default 0 not null
        constraint documents_pk
            primary key,
    documentTitle text,
    public boolean default false not null,
    documentToken text default '' not null,
    created date default 0 not null,
    edited daate default 0 not null,
    source text default '{}'
);

create unique index documents_documentId_uindex
	on documents (documentId);

create unique index documents_documentToken_uindex
	on documents (documentToken);

create table users
(
    userId int not null
        constraint users_pk
            primary key,
    email text not null,
    password text not null,
    joined date not null,
    identifier text,
    userToken text default '' not null
);

create unique index "users_""email""_uindex"
	on users (email);

create unique index "users_""userId""_uindex"
	on users (userId);

create unique index users_userToken_uindex
	on users (userToken);

